import {withApi} from '@/lib/api';import {sourceStatus} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(req:Request){return withApi(req,sourceStatus);}
