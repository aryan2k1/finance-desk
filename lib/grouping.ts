import type {FeedItem} from './feed';
export function londonDay(date:string):string {return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));}
type Event={key:string;percentages:string[];action:string|null};
export function eventIdentity(item:FeedItem,sourceId:string):Event|null {
 const title=item.title.toLowerCase();
 if(/\b(forecasts?|expectations|why|how|what|analysis|explained|expected|will|may|could|preview|minutes|speech|reaction|stocks|markets|opinion|outlook)\b/.test(title))return null;
 let entity:string|null=null;let family='rates';
 if(/\b(uk|britain|british)\b/.test(title)&&/\b(inflation|cpi)\b/.test(title)) {entity='uk';family='cpi';}
 else if(/\b(federal reserve|fed|fomc)\b/.test(title)) entity='fed';
 else if(/\b(bank of england|boe)\b/.test(title)||(sourceId==='boe'&&/\bbank rate\b/.test(title)))entity='boe';
 else if(/\b(european central bank|ecb)\b/.test(title)||(sourceId==='ecb'&&/monetary policy decisions/.test(title)))entity='ecb';
 if(!entity)return null;
 if(family==='cpi'&&!(sourceId==='ons'&&/consumer price inflation/.test(title))&&!/\b(rises?|rose|falls?|fell|eases?|unchanged|reaches?|hits?|at)\b/.test(title))return null;
 const actions=[/\b(raise[sd]?|rais(?:ing|es)|hike[sd]?|increase[sd]?)\b/.test(title)?'raise':null,/\b(cut[st]?|cutting|lower[sed]*|reduce[sd]?)\b/.test(title)?'cut':null,/\b(hold[sd]?|keep[st]?|kept|maintain[sed]*|unchanged)\b/.test(title)?'hold':null].filter(Boolean);
 if(actions.length>1)return null;
 const official=(sourceId==='fed'&&/federal reserve issues fomc statement/.test(title))||(sourceId==='ecb'&&/monetary policy decisions/.test(title));
 if(family==='rates'&&!official&&(!/\b(rate[s]?|interest|monetary policy)\b/.test(title)||(!actions.length&&!/\bdecision[s]?\b/.test(title))))return null;
 const percentages=[...new Set([...title.matchAll(/[+-]?\d+(?:\.\d+)?\s*(?:%|percent\b|per cent\b)/g)].map(m=>m[0].replace(/\s+/g,'').replace(/percent|per cent/,'%')))].sort();
 return {key:`${londonDay(item.publishedAt)}:${entity}:${family}`,percentages,action:actions[0]??null};
}
export function compatibleEvents(a:FeedItem,aSource:string,b:FeedItem,bSource:string):boolean {
 const x=eventIdentity(a,aSource),y=eventIdentity(b,bSource);if(!x||!y||x.key!==y.key)return false;
 if(x.action&&y.action&&x.action!==y.action)return false;
 return !x.percentages.length||!y.percentages.length||JSON.stringify(x.percentages)===JSON.stringify(y.percentages);
}
/** Check every member, so a numberless official headline cannot bridge contradictions. */
export function compatibleCluster(item:FeedItem,source:string,members:Array<{item:FeedItem;sourceId:string}>):boolean {return members.length>0&&members.some(m=>m.sourceId!==source)&&members.every(m=>compatibleEvents(item,source,m.item,m.sourceId));}
