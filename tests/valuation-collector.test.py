"""Synthetic adapter tests; no fixtures are presented as real company evidence."""
import datetime as dt
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
import pandas as pd
spec=importlib.util.spec_from_file_location('valuation_collector',Path('scripts/valuation-collector.py'))
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
class Statement:
    def __init__(self,values): self.values=values
    def df(self): return pd.DataFrame({'Breakdown':list(self.values),'2026-01-31':list(self.values.values())})
class Ticker:
    def __init__(self,symbol): self.symbol=symbol
    def annual_income_statement(self): return Statement({'Operating Income':100})
    def annual_cash_flow(self): return Statement({'Depreciation & Amortization':10,'Capital Expenditure (CapEx)':-15,'Change In Working Capital':-4})
    def annual_balance_sheet(self): return Statement({'Cash And Cash Equivalents':20,'Current Debt':10,'Long Term Debt':20})
    def shares(self): return pd.DataFrame([{'symbol':self.symbol,'report_date':'2026-02-01','shares_outstanding':10}])
    def price(self): return pd.DataFrame([{'symbol':self.symbol,'report_date':'2026-02-02','close':80}])
class CollectorTests(unittest.TestCase):
    def test_rotation(self):
        self.assertEqual(collector.selection(dt.date(2026,10,9))[0],'MSFT')
        self.assertEqual(collector.selection(dt.date(2026,10,11))[0],'UPS')
        self.assertEqual(collector.selection(dt.date(2026,10,14))[0],'MSFT')
    @patch('defeatbeta_api.data.ticker.Ticker',Ticker)
    def test_reviewed_provider_period_maps_to_actual_fiscal_date(self):
        override=lambda value:{'value':value,'period':'2026-02-01','url':'https://ir.homedepot.com/filing','field':'Reviewed test field','reason':'Synthetic adapter fixture'}
        proof={'HD':{'status':'verified','fiscalPeriodEnd':'2026-02-01','providerPeriodEnd':'2026-01-31','periodMappingReason':'Provider normalises month end; actual filing period is February 1','url':'https://ir.homedepot.com/filing','checkedAt':'2026-10-09T00:00:00Z','note':'Synthetic fixture','expected':{'ebit':100,'da':10,'capex':15,'changeNwc':4,'cash':20,'debt':30},'primaryInputs':{'da':override(10),'changeNwc':override(4)}}}
        lesson=collector.collect(proof,'HD')
        self.assertEqual(lesson['fiscalPeriodEnd'],'2026-02-01')
        self.assertEqual(lesson['inputs']['ebit']['asOf'],'2026-02-01')
        self.assertIn('2026-01-31',next(s['field'] for s in lesson['sources'] if s['id']=='defeatbeta-ebit'))
        self.assertEqual(next(s['period'] for s in lesson['sources'] if s['id']=='primary-filing'),'2026-02-01')
        del proof['HD']['periodMappingReason']
        with self.assertRaises(ValueError): collector.collect(proof,'HD')
if __name__=='__main__': unittest.main()
