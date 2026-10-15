import {getRawDb,runtimeEnv} from '@/db';
import {accessAllowed,apiError} from './access';
export async function withApi(request:Request,fn:(db:D1Database,env:Record<string,unknown>)=>Promise<unknown>){const env=runtimeEnv();if(!accessAllowed(request.url,env))return apiError('Private access required',401);try{return Response.json(await fn(getRawDb(),env),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Finance Desk operation failed',e instanceof Error?e.message:'Unknown error');return apiError('This information is temporarily unavailable. Please try again.');}}
