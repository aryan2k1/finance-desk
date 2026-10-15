export interface ValuationSource {id:string;label:string;url:string;provider:string;field:string;period:string;unit:string;retrievedAt:string}
export interface ValuationDatum {value:number|null;sourceIds:string[];asOf:string}
export interface ValuationInputs {ebit:ValuationDatum;da:ValuationDatum;capex:ValuationDatum;changeNwc:ValuationDatum;cash:ValuationDatum;debt:ValuationDatum;shares:ValuationDatum;price:ValuationDatum}
export interface PrimaryValidation {status:'verified'|'unverified';note:string;sourceIds:string[]}
export interface DcfAssumptions {taxRate:number;growthRate:number;discountRate:number;terminalGrowthRate:number}
export interface DcfResult {baseFcff:number;projections:Array<{year:number;fcff:number;presentValue:number}>;terminalValue:number;presentTerminalValue:number;enterpriseValue:number;equityValue:number;valuePerShare:number;upsidePercent:number|null}
export interface ValuationLesson {date:string;symbol:string;company:string;sector:string;method:'fcff-dcf-v1'|'unavailable';status:'ready'|'unavailable';createdAt:string;fiscalPeriodEnd:string;currency:'USD';inputs:ValuationInputs|null;primaryValidation:PrimaryValidation;sources:ValuationSource[];assumptions:DcfAssumptions;result:DcfResult|null;limitations:string[];unavailableReasons:string[]}
export interface ValuationsResponse {latest:ValuationLesson|null;archive:Array<Pick<ValuationLesson,'date'|'symbol'|'company'|'sector'|'status'|'method'>>;schedule:{status:'active'|'not_configured';note:string}}
export const DEFAULT_ASSUMPTIONS:DcfAssumptions={taxRate:.21,growthRate:.05,discountRate:.1,terminalGrowthRate:.02};
