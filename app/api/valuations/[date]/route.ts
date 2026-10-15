import {withApi} from '@/lib/api';import {getValuation} from '@/lib/valuation-import';import {validDate} from '@/lib/valuation-selection';
export const dynamic='force-dynamic';
export async function GET(request:Request,ctx:{params:Promise<{date:string}>}){const {date}=await ctx.params;if(!validDate(date))return Response.json({error:'Invalid date'},{status:400});const response=await withApi(request,db=>getValuation(db,date));if(response.status===200&&await response.clone().json()===null)return Response.json({error:'Lesson not found'},{status:404});return response;}
