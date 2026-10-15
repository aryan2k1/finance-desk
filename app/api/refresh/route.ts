import {withApi} from '@/lib/api';import {refresh} from '@/lib/refresh';
export const dynamic='force-dynamic';
export async function POST(req:Request){if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Cross-site refresh denied'},{status:403});return withApi(req,refresh);}
