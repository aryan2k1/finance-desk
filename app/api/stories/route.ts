import {withApi} from '@/lib/api';
import {listStories} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(req:Request){return withApi(req,async (db,env)=>{const url=new URL(req.url);const category=url.searchParams.get('category');return listStories(db,category&&['economy','finance','technology','breaking'].includes(category)?category:null,Number(url.searchParams.get('page')??1),Number(url.searchParams.get('pageSize')??24),env);});}
