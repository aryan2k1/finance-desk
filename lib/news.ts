import type {Story} from './contracts';
import type {Source} from './sources';
import {extractParagraphs,parseFeed,plainText,safeFetch,safeUrl,type FeedItem} from './feed';
export async function digest(text:string):Promise<string>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function groupKey(item:FeedItem):string {return `${item.publishedAt.slice(0,10)}:${item.title.toLowerCase().replace(/\s+/g,' ').trim()}`;}
export function scoreStory(item:FeedItem,source:Source,now=new Date()):number {const age=Math.max(0,(now.getTime()-Date.parse(item.publishedAt))/3600000);return Math.round(1000-age+(source.id==='ons'?70:0)+(/rate|inflation|interest|GDP|employment|monetary|earnings/i.test(item.title)?60:0));}
export async function fetchItems(source:Source):Promise<FeedItem[]>{
 const body=await safeFetch(source.url,source.hosts);
 if(source.kind==='ons'){
  const data=JSON.parse(body);if(!Array.isArray(data.items))throw new Error('Unexpected ONS response');
  return data.items.filter((i:{uri?:string;release_date:string;title?:unknown;summary?:unknown;meta_description?:unknown})=>/economy|employmentandlabourmarket|businessindustryandtrade/.test(i.uri??'')).flatMap((i:{uri?:string;release_date:string;title?:unknown;summary?:unknown;meta_description?:unknown})=>{const url=safeUrl(new URL(i.uri??'','https://www.ons.gov.uk').href,source.hosts);const date=new Date(i.release_date);return url&&Number.isFinite(date.getTime())&&date.getTime()<=Date.now()? [{title:plainText(i.title),url,description:plainText(i.summary??i.meta_description),publishedAt:date.toISOString()}]:[];});
 }return parseFeed(body,source.hosts);
}
export async function makeStory(item:FeedItem,source:Source,now:string):Promise<Story & {retrievalError?:string}>{
 const id=await digest(groupKey(item));let paragraphs:string[]=[];let retrievalError:string|undefined;
 if(source.permissions.summarise){
  try {const html=await safeFetch(item.url,source.hosts); let section=html;
   if(source.id==='fed'){const start=html.indexOf('col-xs-12 col-sm-8 col-md-8'); section=start>=0?html.slice(start).split('<div class="col-xs-12 col-sm-4 col-md-4">')[0]:'';}
   if(source.id==='ons'){const start=html.search(/id=["'](?:main-points|mainpoints)["']/i);section=start>=0?html.slice(start,start+18000):'';}
   paragraphs=extractParagraphs(section).slice(0,4);
   if(source.id==='ons'&&paragraphs.length===0){paragraphs=[...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(x=>plainText(x[1])).filter(x=>x.length>70).slice(0,4);}
  }catch{retrievalError='Official article text is temporarily unavailable; feed metadata retained.';}
 }
 if(source.permissions.summarise&&paragraphs.length===0&&!retrievalError)retrievalError='No eligible article passages found; last good brief retained where available.';
 const hasText=paragraphs.length>0;const description=source.id==='ecb'?'':item.description!==item.title?item.description:'';
 return {retrievalError,id,title:item.title,category:source.category,publishedAt:item.publishedAt,updatedAt:now,preview:description||'Open the original release and available coverage.',brief:{mode:hasText?'sourced':'limited',intro:hasText?'Key passages from the original official release, reproduced without interpretation.':description||'Only headline metadata is available for this item.',facts:paragraphs.map(text=>({text,sourceIds:[source.id]})),limitation:hasText?'Extractive brief. Read the original release for complete context.':'Limited source text available. No full-article summary has been generated.'},sources:[{id:source.id,name:source.name,url:item.url,role:hasText||description?'evidence':'related',publishedAt:item.publishedAt,...(source.id.startsWith('bbc-')?{branding:{imageUrl:'https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif',link:'https://www.bbc.co.uk/news'}}:{})}]};
}
