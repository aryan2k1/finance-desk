import proof from '@/data/valuation-primary-validation.json';
import {runtimeEnv} from '@/db';import {accessAllowed} from '@/lib/access';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!accessAllowed(request.url,runtimeEnv()))return Response.json({error:'Private access required'},{status:401});return Response.json(proof,{headers:{'Cache-Control':'no-store'}});}
