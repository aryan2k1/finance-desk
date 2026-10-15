"use client";
import { useEffect, useState } from "react";
type ResourceState<T> = {url:string;data:T|null;error:string};
export function useResource<T>(url:string){
 const [state,setState]=useState<ResourceState<T>>({url,data:null,error:""});const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let alive=true;let controller:AbortController|null=null;
 const read=()=>{controller?.abort();controller=new AbortController();const current=controller;const timer=setTimeout(()=>current.abort(),25000);fetch(url,{signal:current.signal,credentials:"same-origin",cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error(r.status===401||r.status===403?"Sign in to access your private desk.":"The desk could not reach this service. Your saved edition remains safe.");return r.json() as Promise<T>}).then(data=>{if(alive&&current===controller)setState({url,data,error:""})}).catch(e=>{if(alive&&current===controller)setState(previous=>({url,data:previous.url===url?previous.data:null,error:e.name==="AbortError"?"This service is taking longer than expected. Please try again.":e.message}))}).finally(()=>clearTimeout(timer))};
 read();const interval=setInterval(()=>{if(document.visibilityState==="visible")read()},60000);const visible=()=>{if(document.visibilityState==="visible")read()};document.addEventListener("visibilitychange",visible);
 return()=>{alive=false;controller?.abort();clearInterval(interval);document.removeEventListener("visibilitychange",visible)}},[url,attempt]);
 return {data:state.url===url?state.data:null,error:state.url===url?state.error:"",retry:()=>{setState(previous=>({...previous,error:""}));setAttempt(n=>n+1)}};
}
