import collector from '@/scripts/valuation-collector.py?raw';
import {runtimeEnv} from '@/db';import {accessAllowed} from '@/lib/access';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!accessAllowed(request.url,runtimeEnv()))return Response.json({error:'Private access required'},{status:401});return new Response(collector,{headers:{'Content-Type':'text/x-python; charset=utf-8','Cache-Control':'no-store'}});}
