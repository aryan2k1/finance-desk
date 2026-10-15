import {withApi} from '@/lib/api';
import {storyById} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){const {id}=await ctx.params;const response=await withApi(req,db=>storyById(db,id));if(response.status===200&&(await response.clone().json())===null)return Response.json({error:'Story not found'},{status:404});return response;}
