import {withApi} from '@/lib/api';import {listValuations} from '@/lib/valuation-import';
export const dynamic='force-dynamic';
export async function GET(request:Request){return withApi(request,listValuations);}
