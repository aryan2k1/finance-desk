/** Production requests have already passed the owner-private Sites dispatcher.
 * Never use identity headers as an alternative to this verified deployment boundary. */
export function accessAllowed(url:string, env:Record<string,unknown>):boolean {
 if(env.FINANCE_DESK_OWNER_PRIVATE === 'true') return true;
 const hostname=new URL(url).hostname;
 return env.NODE_ENV !== 'production' && ['127.0.0.1','localhost','[::1]'].includes(hostname);
}
export function apiError(message:string,status=503){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});}
