import {z} from 'zod';
import {calculateDcf} from './valuation-model';
import {DEFAULT_ASSUMPTIONS,type ValuationLesson,type ValuationsResponse} from './valuation-contracts';
import {londonDate,selectedCompany,validDate} from './valuation-selection';
const date=z.string().refine(validDate,'Invalid calendar date');
const timestamp=z.string().refine(s=>Number.isFinite(Date.parse(s))&&/^\d{4}-\d{2}-\d{2}T/.test(s),'Invalid timestamp');
const source=z.object({id:z.string().min(1).max(100),label:z.string().min(1).max(300),url:z.string().url().refine(s=>new URL(s).protocol==='https:'&&!new URL(s).username&&!new URL(s).password,'Evidence requires HTTPS'),provider:z.string().min(1).max(100),field:z.string().min(1).max(200),period:date,unit:z.enum(['USD','shares','USD/share','document']),retrievedAt:timestamp});
const datum=z.object({value:z.number().finite().nullable(),sourceIds:z.array(z.string()).max(10),asOf:date});
const schema=z.object({date,symbol:z.string(),company:z.string(),sector:z.string(),method:z.enum(['fcff-dcf-v1','unavailable']),status:z.enum(['ready','unavailable']),fiscalPeriodEnd:date,currency:z.literal('USD'),inputs:z.object({ebit:datum,da:datum,capex:datum,changeNwc:datum,cash:datum,debt:datum,shares:datum,price:datum}).nullable(),primaryValidation:z.object({status:z.enum(['verified','unverified']),note:z.string().min(1).max(2000),sourceIds:z.array(z.string())}),sources:z.array(source).max(50),unavailableReasons:z.array(z.string().min(1).max(1000)).max(20).default([]),limitations:z.array(z.string().min(1).max(1500)).max(20).default([])});
export function validateLesson(payload:unknown,now=new Date()):ValuationLesson {
 const value=schema.parse(payload);if(Date.parse(value.fiscalPeriodEnd)>now.getTime())throw new Error('Fiscal period is in the future');if(value.date!==londonDate(now))throw new Error('Import must use the current London date');const selected=selectedCompany(value.date);if(value.symbol!==selected.symbol||value.company!==selected.company||value.sector!==selected.sector)throw new Error('Company does not match the daily rotation');
 const sources=new Map(value.sources.map(s=>[s.id,s]));if(sources.size!==value.sources.length)throw new Error('Duplicate evidence IDs');
 for(const s of value.sources)if(Date.parse(s.retrievedAt)>now.getTime()+300000||Date.parse(s.period)>now.getTime())throw new Error('Evidence date is in the future');
 if(value.primaryValidation.sourceIds.some(id=>!sources.has(id)))throw new Error('Missing primary-validation evidence');
 const base={...value,createdAt:now.toISOString(),assumptions:{...DEFAULT_ASSUMPTIONS},limitations:['Illustrative assumptions, not analyst estimates or market-implied rates.','Constant five-year FCFF growth and terminal growth simplify the business.','Assumed tax and WACC; non-debt claims and other valuation adjustments are omitted.',...value.limitations],result:null};
 if(value.status==='unavailable'){if(value.method!=='unavailable'||!value.unavailableReasons.length)throw new Error('Unavailable lessons require concrete reasons');return {...base,method:'unavailable',status:'unavailable',inputs:null};}
 if(value.method!=='fcff-dcf-v1'||!value.inputs)throw new Error('Ready lesson requires supported FCFF inputs');
 if(value.primaryValidation.status!=='verified'||!value.primaryValidation.sourceIds.length)throw new Error('Primary filing validation is required');
 for(const id of value.primaryValidation.sourceIds){const evidence=sources.get(id)!;if(evidence.period!==value.fiscalPeriodEnd||evidence.unit!=='document'||Date.parse(evidence.retrievedAt)<Date.parse(evidence.period))throw new Error('Primary filing evidence must match fiscal period and document units');}
 const issuers:Record<string,{domain:string;cik:string}>={MSFT:{domain:'microsoft.com',cik:'789019'},PG:{domain:'pg.com',cik:'80424'},UPS:{domain:'ups.com',cik:'1090727'},JNJ:{domain:'jnj.com',cik:'200406'},HD:{domain:'homedepot.com',cik:'354950'}};
 const issuer=issuers[value.symbol];if(!value.primaryValidation.sourceIds.some(id=>{const url=new URL(sources.get(id)!.url),host=url.hostname;return host===issuer.domain||host.endsWith('.'+issuer.domain)||((host==='www.sec.gov'||host==='sec.gov')&&url.pathname.startsWith('/Archives/edgar/data/'+issuer.cik+'/'));}))throw new Error('Primary evidence must match the selected company filing');

 for(const [key,d] of Object.entries(value.inputs)){
  if(key==='price'&&d.value===null)continue;if(key==='price'&&d.value!==null&&d.value<=0)throw new Error('Observed price must be positive');
  if(d.value===null||!d.sourceIds.length||d.sourceIds.some(id=>!sources.has(id)))throw new Error(`Missing ${key} evidence`);
  if(Date.parse(d.asOf)>now.getTime())throw new Error(`Future ${key} observation`);
  const isFlow=['ebit','da','capex','changeNwc'].includes(key);if(isFlow&&d.asOf!==value.fiscalPeriodEnd)throw new Error('Annual operating inputs must share fiscal period');
  for(const id of d.sourceIds){const s=sources.get(id)!;if(s.period!==d.asOf)throw new Error(`Evidence period mismatch for ${key}`);if(s.unit!==(key==='shares'?'shares':key==='price'?'USD/share':'USD'))throw new Error(`Evidence unit mismatch for ${key}`);}
 }
 return {...base,method:'fcff-dcf-v1',status:'ready',inputs:value.inputs,result:calculateDcf(value.inputs,DEFAULT_ASSUMPTIONS)};
}
export async function importLesson(db:D1Database,payload:unknown,now=new Date()){
 const lesson=validateLesson(payload,now);const result=await db.prepare('INSERT INTO valuation_lessons(date,symbol,created_at,data) VALUES(?,?,?,?) ON CONFLICT(date) DO NOTHING').bind(lesson.date,lesson.symbol,lesson.createdAt,JSON.stringify(lesson)).run();
 await db.prepare('INSERT INTO valuation_attempts(date,attempted_at,status,reason) VALUES(?,?,?,?)').bind(lesson.date,now.toISOString(),'success',null).run();return {status:result.meta.changes?'inserted':'existing',lesson:await getValuation(db,lesson.date)};
}
export async function getValuation(db:D1Database,date:string):Promise<ValuationLesson|null>{const row=await db.prepare('SELECT data FROM valuation_lessons WHERE date=?').bind(date).first<{data:string}>();return row?JSON.parse(row.data):null;}
export async function listValuations(db:D1Database,env:Record<string,unknown>):Promise<ValuationsResponse>{const rows=await db.prepare('SELECT data FROM valuation_lessons ORDER BY date DESC').all<{data:string}>();const lessons=rows.results.map(r=>JSON.parse(r.data) as ValuationLesson);const failure=await db.prepare('SELECT reason FROM valuation_attempts WHERE date=? ORDER BY id DESC LIMIT 1').bind(londonDate()).first<{reason:string|null}>();return {latest:lessons[0]??null,archive:lessons.map(({date,symbol,company,sector,status,method})=>({date,symbol,company,sector,status,method})),schedule:{status:env.VALUATIONS_SCHEDULE_ACTIVE==='true'?'active':'not_configured',note:failure?.reason?`Latest collection failed: ${failure.reason}`:env.VALUATIONS_SCHEDULE_ACTIVE==='true'?'Daily collection is configured.':'Daily collection has not been activated.'}};}
