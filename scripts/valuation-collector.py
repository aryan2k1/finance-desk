#!/usr/bin/env python3
"""Private Finance Desk collector. Install defeatbeta-api==0.0.62.
Reads reviewed primary-validation JSON and optional service token from environment.
Never writes a lesson with guessed mappings or unverified financial values.
"""
import argparse, contextlib, datetime as dt, importlib.metadata, json, math, os, sys, urllib.request
from zoneinfo import ZoneInfo
REGISTRY=[('MSFT','Microsoft','Technology'),('PG','Procter & Gamble','Consumer staples'),('UPS','United Parcel Service','Industrials'),('JNJ','Johnson & Johnson','Healthcare'),('HD','Home Depot','Consumer discretionary')]
ANCHOR=dt.date(2026,10,9)
def selection(day): return REGISTRY[(day-ANCHOR).days%5]
def number(value):
    if value is None or str(value).strip() in ('*','None','nan',''): raise ValueError('Required provider value is missing')
    result=float(value)
    if not math.isfinite(result): raise ValueError('Provider value is not finite')
    return result

def collect(validation,validate_symbol=None):
    if importlib.metadata.version('defeatbeta-api')!='0.0.62': raise ValueError('Collector requires defeatbeta-api==0.0.62')
    now=dt.datetime.now(dt.timezone.utc); day=now.astimezone(ZoneInfo('Europe/London')).date(); symbol,company,sector=selection(day)
    if validate_symbol: symbol,company,sector=next(row for row in REGISTRY if row[0]==validate_symbol)
    proof=validation.get(symbol)
    if not proof: raise ValueError('No reviewed primary filing mapping for today\'s company')
    if proof.get('status')!='verified' or not proof.get('url','').startswith('https://'): raise ValueError('Primary filing validation is incomplete')
    period=proof['fiscalPeriodEnd']; dt.date.fromisoformat(period)
    provider_period=proof.get('providerPeriodEnd',period);dt.date.fromisoformat(provider_period)
    if provider_period!=period and not proof.get('periodMappingReason'): raise ValueError('Provider fiscal-label adjustment requires reviewed mapping reason')
    from defeatbeta_api.data.ticker import Ticker
    with contextlib.redirect_stdout(sys.stderr):
        ticker=Ticker(symbol)
        income=ticker.annual_income_statement().df(); cashflow=ticker.annual_cash_flow().df(); balance=ticker.annual_balance_sheet().df(); shares=ticker.shares(); prices=ticker.price()
    def field(frame,label):
        if provider_period not in frame.columns: raise ValueError('Reviewed fiscal period absent from provider')
        row=frame[frame['Breakdown']==label]
        if len(row)!=1: raise ValueError('Required financial mapping absent or duplicated: '+label)
        return number(row.iloc[0][provider_period])
    overrides=proof.get('primaryInputs',{})
    if any(key not in overrides for key in ('da','changeNwc')): raise ValueError('Strict D&A and operating NWC require separately reconciled primary inputs; provider proxy rows are not sufficient')
    values={'ebit':field(income,'Operating Income'),'da':field(cashflow,'Depreciation & Amortization'),'capex':-field(cashflow,'Capital Expenditure (CapEx)'),'changeNwc':-field(cashflow,'Change In Working Capital'),'cash':field(balance,'Cash And Cash Equivalents'),'debt':field(balance,'Current Debt')+field(balance,'Long Term Debt')}
    labels={'ebit':'Annual Operating Income (operating EBIT proxy)','da':'Annual Depreciation & Amortization','capex':'Annual Capital Expenditure (CapEx), sign inverted to positive outflow','changeNwc':'Annual Change In Working Capital, sign inverted to positive cash use','cash':'Cash And Cash Equivalents; excludes short-term investments','debt':'Current Debt + Long Term Debt; excludes separately reported lease obligations'}
    original_values=dict(values)
    for key,entry in overrides.items():
        if key not in values or not entry.get('url','').startswith('https://') or entry.get('period')!=period or not entry.get('field') or not entry.get('reason'): raise ValueError('Invalid primary input override')
        values[key]=number(entry['value'])
    for key,value in values.items():
        checked=number(proof['expected'][key])
        if not math.isclose(value,checked,rel_tol=1e-8,abs_tol=.01): raise ValueError('Provider '+key+' differs from reviewed primary filing')
    sources=[]; inputs={}; retrieved=now.isoformat().replace('+00:00','Z'); provider='defeatbeta-api 0.0.62'
    def add(key,value,as_of,unit,label):
        sid='defeatbeta-'+key
        sources.append({'id':sid,'label':label,'url':'https://huggingface.co/datasets/defeatbeta/yahoo-finance-data','provider':provider,'field':label,'period':as_of,'unit':unit,'retrievedAt':retrieved})
        inputs[key]={'value':value,'sourceIds':[sid],'asOf':as_of}
    for key,value in values.items():
        field_label=labels[key]+(' [provider period '+provider_period+' mapped to actual fiscal period '+period+': '+proof['periodMappingReason']+']' if provider_period!=period else '')
        add(key,value,period,'USD',field_label)
        if key in overrides:
            entry=overrides[key];sources.append(dict(sources[-1],id='original-provider-'+key,label=labels[key]+'; original provider value '+str(original_values[key])));sources[-2].update({'label':entry['field']+'; '+entry['reason'],'url':entry['url'],'provider':'Reviewed company primary filing','field':entry['field'],'retrievedAt':entry.get('retrievedAt',proof['checkedAt'])})
    def observation(frame,value_field):
        frame=frame[frame['symbol']==symbol].copy(); frame['_date']=frame['report_date'].astype(str).str[:10]
        frame=frame[frame['_date']<=str(day)].sort_values('_date')
        if frame.empty: raise ValueError('No dated provider observation for '+value_field)
        row=frame.iloc[-1];return number(row[value_field]),str(row['_date'])
    share_count,share_date=observation(shares,'shares_outstanding')
    expected_shares=proof.get('expectedShares')
    if expected_shares and (share_date!=expected_shares['asOf'] or not math.isclose(share_count,number(expected_shares['value']),rel_tol=1e-10)): raise ValueError('Shares observation changed from the reviewed primary count; review required')
    add('shares',share_count,share_date,'shares','shares_outstanding (actual shares)')
    try:
        price,price_date=observation(prices,'close');add('price',price,price_date,'USD/share','Daily close, dated provider observation')
    except ValueError: inputs['price']={'value':None,'sourceIds':[],'asOf':str(day)}
    sources.append({'id':'primary-filing','label':'Reviewed company primary financial report','url':proof['url'],'provider':'Company primary filing','field':'Annual financial statements cross-check','period':period,'unit':'document','retrievedAt':proof['checkedAt']})
    return {'date':str(day),'symbol':symbol,'company':company,'sector':sector,'method':'fcff-dcf-v1','status':'ready','fiscalPeriodEnd':period,'currency':'USD','inputs':inputs,'primaryValidation':{'status':'verified','note':proof['note'],'sourceIds':['primary-filing']},'sources':sources,'limitations':proof.get('limitations',[]),'unavailableReasons':[]}

def post(site,payload):
    if not site.startswith('https://'): raise ValueError('Import requires an HTTPS private Site')
    headers={'Content-Type':'application/json'}; token=os.environ.get('OAI_SITES_SERVICE_TOKEN')
    if token: headers['OAI-Sites-Authorization']='Bearer '+token
    req=urllib.request.Request(site.rstrip('/')+'/api/valuations/import',data=json.dumps(payload,allow_nan=False).encode(),headers=headers,method='POST')
    with urllib.request.urlopen(req,timeout=60) as response: return json.load(response)

def main():
    p=argparse.ArgumentParser();p.add_argument('--validation-file',required=True);p.add_argument('--site');p.add_argument('--output');p.add_argument('--validate-symbol',choices=[row[0] for row in REGISTRY]);args=p.parse_args()
    if args.validate_symbol and args.site: raise ValueError('Local validation cannot import to a Site')
    if os.environ.get('VALUATIONS_PROVIDER_STORAGE_VERIFIED')!='true': raise ValueError('Provider storage rights must be explicitly verified')
    try:
        with open(args.validation_file) as f: validation=json.load(f)
        lesson=collect(validation,args.validate_symbol)
        if args.output:
            with open(args.output,'w') as f: json.dump(lesson,f,allow_nan=False,indent=2)
        if args.site:
            result=post(args.site,lesson);print(json.dumps({'status':result['status'],'date':lesson['date'],'symbol':lesson['symbol']}))
        elif not args.output: print(json.dumps(lesson,allow_nan=False))
    except Exception as exc:
        reason=str(exc)[:300] if isinstance(exc,(ValueError,KeyError)) else 'Provider collection failed ('+type(exc).__name__+')'
        if args.site:
            try: post(args.site,{'collectionFailure':reason})
            except Exception: pass
        raise
if __name__=='__main__': main()
