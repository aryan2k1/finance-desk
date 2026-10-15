import type {DcfAssumptions,DcfResult,ValuationInputs} from './valuation-contracts';
export function calculateDcf(inputs:ValuationInputs,a:DcfAssumptions):DcfResult {
 const ranges={taxRate:[0,.5],growthRate:[-.5,.5],discountRate:[.01,.4],terminalGrowthRate:[-.05,.1]} as const;
 for(const key of Object.keys(ranges) as Array<keyof DcfAssumptions>){const value=a[key],[min,max]=ranges[key];if(!Number.isFinite(value)||value<min||value>max)throw new Error(`Invalid ${key}`);}
 if(a.discountRate-a.terminalGrowthRate<.005-1e-12)throw new Error('Discount rate must exceed terminal growth by at least 0.5 percentage points');
 const required=['ebit','da','capex','changeNwc','cash','debt','shares'] as const;
 for(const key of required)if(inputs[key]?.value===null||!Number.isFinite(inputs[key]?.value))throw new Error(`Missing or invalid ${key}`);
 const ebit=inputs.ebit.value!,da=inputs.da.value!,capex=inputs.capex.value!,changeNwc=inputs.changeNwc.value!,cash=inputs.cash.value!,debt=inputs.debt.value!,shares=inputs.shares.value!;
 if(shares<=0||cash<0||debt<0||capex<0||da<0)throw new Error('Shares must be positive; cash, debt, capex and D&A cannot be negative');
 const baseFcff=ebit*(1-a.taxRate)+da-capex-changeNwc;if(baseFcff<=0)throw new Error('This prototype requires positive baseline FCFF');
 const projections=Array.from({length:5},(_,i)=>{const year=i+1,fcff=baseFcff*(1+a.growthRate)**year;return {year,fcff,presentValue:fcff/(1+a.discountRate)**year};});
 const terminalValue=projections[4].fcff*(1+a.terminalGrowthRate)/(a.discountRate-a.terminalGrowthRate),presentTerminalValue=terminalValue/(1+a.discountRate)**5;
 const enterpriseValue=projections.reduce((n,p)=>n+p.presentValue,0)+presentTerminalValue,equityValue=enterpriseValue+cash-debt,valuePerShare=equityValue/shares;
 const price=inputs.price?.value;const upsidePercent=typeof price==='number'&&Number.isFinite(price)&&price>0?(valuePerShare/price-1)*100:null;
 if(upsidePercent!==null&&!Number.isFinite(upsidePercent))throw new Error('Price comparison overflow');
 const result={baseFcff,projections,terminalValue,presentTerminalValue,enterpriseValue,equityValue,valuePerShare,upsidePercent};if(![baseFcff,terminalValue,presentTerminalValue,enterpriseValue,equityValue,valuePerShare,...projections.flatMap(p=>[p.fcff,p.presentValue])].every(Number.isFinite))throw new Error('Model overflow');return result;
}
