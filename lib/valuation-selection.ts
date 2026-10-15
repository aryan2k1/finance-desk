export const VALUATION_REGISTRY=[{symbol:'MSFT',company:'Microsoft',sector:'Technology'},{symbol:'PG',company:'Procter & Gamble',sector:'Consumer staples'},{symbol:'UPS',company:'United Parcel Service',sector:'Industrials'},{symbol:'JNJ',company:'Johnson & Johnson',sector:'Healthcare'},{symbol:'HD',company:'Home Depot',sector:'Consumer discretionary'}] as const;
export const VALUATION_ANCHOR='2026-10-09';
export function londonDate(now=new Date()):string{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function validDate(date:string):boolean{return /^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;}
export function selectedCompany(date:string){if(!validDate(date))throw new Error('Invalid lesson date');const days=Math.round((Date.parse(date)-Date.parse(VALUATION_ANCHOR))/86400000);return VALUATION_REGISTRY[((days%5)+5)%5];}
