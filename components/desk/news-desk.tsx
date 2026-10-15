"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { StoriesResponse, Story, SourceStatusResponse } from "@/lib/contracts";
import { DeskShell, EmptyState, LoadingState, timeLabel } from "./shell";
import { MarketBoard } from "./market-board";
import { useResource } from "./use-resource";
function Sources({story}:{story:Story}){return <div className="story-sources">{story.sources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.id}>{s.branding&&<img className="feed-brand" src={s.branding.imageUrl} alt="" width="40" height="20"/>}{s.name}<ArrowUpRight size={10}/></a>)}</div>}
function StoryCard({story,lead=false}:{story:Story;lead?:boolean}){
 const href=`/stories/${encodeURIComponent(story.id)}`;
 return <article className={`story-card ${lead?"lead-story":""}`}><div className="story-kicker"><span>{story.category}</span><time dateTime={story.publishedAt}>{timeLabel(story.publishedAt)}</time></div><h2><a href={href}>{story.title}</a></h2>{story.preview&&<p className="story-preview">{story.preview}</p>}<Sources story={story}/><div className="card-end"><a href={href}>Read the brief <ArrowRight size={15}/></a><span>{story.brief.mode==="limited"?"SOURCE DIGEST":"SOURCE EXTRACTS"}</span></div></article>
}
export function NewsDesk(){const searchParams=useSearchParams();const candidate=searchParams.get("category")??"";const category=["economy","finance","technology","breaking"].includes(candidate)?candidate:"";return <DeskEdition key={category} category={category}/>;}
function DeskEdition({category}:{category:string}){
 const[page,setPage]=useState(1);const {data,error,retry}=useResource<StoriesResponse>(`/api/stories?page=${page}&pageSize=10${category?`&category=${category}`:""}`);const status=useResource<SourceStatusResponse>("/api/source-status");const stories=data?.stories??[];const title=category?category.charAt(0).toUpperCase()+category.slice(1):"Top stories";
 return <DeskShell active={title} updated={data?.lastRefreshAt}>
 {category&&<h1 className="edition-category">{title}</h1>}
 {!category&&<h1 className="visually-hidden">Top stories</h1>}
 {status.data?.access.mode==="local_preview"&&<div className="preview-note"><span>LOCAL PREVIEW</span> {status.data.access.note}</div>}
 <div className="main-grid newspaper-grid"><div className="news-column">
 {error&&!data?<EmptyState title="The desk is temporarily unavailable" text={error} retry={retry}/>:!data?<LoadingState/>:!stories.length?<EmptyState title="A clear desk, for now." text="No stories have arrived in this edition yet. Check the source monitor for the latest collection status." retry={retry}/>:<div className="top-editorial">{stories.slice(0,2).map(s=><StoryCard key={s.id} story={s} lead/>)}</div>}
 </div><aside><MarketBoard/></aside></div>
 {stories.length>2&&<><div className="section-rule"><h2>{category?`More in ${title.toLowerCase()}`:"The latest"}</h2><span>{data?.total} stories in this edition</span></div><div className="story-grid newspaper-stories">{stories.slice(2,6).map(s=><StoryCard story={s} key={s.id}/>)}</div></>}
 {stories.length>6&&<><div className="section-rule"><h2>On the wire</h2><span>MORE TO KNOW</span></div><div className="wire-list compact-wire">{stories.slice(6).map(s=><article key={s.id}><time>{timeLabel(s.publishedAt)}</time><div><span className="eyebrow">{s.category}</span><h3><a href={`/stories/${encodeURIComponent(s.id)}`}>{s.title}</a></h3><Sources story={s}/></div><a href={`/stories/${encodeURIComponent(s.id)}`} aria-label={`Read ${s.title}`}><ArrowUpRight size={19}/></a></article>)}</div></>}
 {data&&data.total>data.pageSize&&<div className="pagination"><button disabled={page===1} onClick={()=>{setPage(p=>p-1);window.scrollTo({top:0,behavior:"smooth"})}}>← Previous</button><span>Page {data.page} of {Math.ceil(data.total/data.pageSize)}</span><button disabled={page*data.pageSize>=data.total} onClick={()=>{setPage(p=>p+1);window.scrollTo({top:0,behavior:"smooth"})}}>Next →</button></div>}
 </DeskShell>
}
