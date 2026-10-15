import type {Story} from './contracts';
import {SOURCES} from './sources';
import {digest} from './news';
/** Keep an audit of permitted official extracts only. Publisher feed text and
 * related coverage never enter history, even when they share a live story. */
export async function briefVersionStatements(db:D1Database,story:Story,now:string):Promise<D1PreparedStatement[]> {
 const eligible=story.sources.filter(s=>s.role==='evidence'&&SOURCES.some(policy=>policy.id===s.id&&policy.permissions.summarise));
 const ids=new Set(eligible.map(s=>s.id));
 const facts=story.brief.facts.filter(f=>f.sourceIds.length>0&&f.sourceIds.every(id=>ids.has(id))).map(f=>({...f,sourceIds:[...f.sourceIds].sort()}));
 if(story.brief.mode!=='sourced'||!facts.length)return [];
 const expiry=Math.min(...eligible.map(s=>Date.parse(s.publishedAt??story.publishedAt)+(SOURCES.find(p=>p.id===s.id)!.permissions.retentionDays*86400000)));
 if(!Number.isFinite(expiry)||expiry<=Date.parse(now))return [];
 // Omit title/preview/intro: those may originate in restricted publisher feeds.
 const snapshot={facts,sources:eligible.map(s=>({id:s.id,name:s.name,url:s.url,publishedAt:s.publishedAt})).sort((a,b)=>a.id.localeCompare(b.id))};
 const data=JSON.stringify(snapshot),fingerprint=await digest(data);
 const last=await db.prepare('SELECT fingerprint FROM brief_versions WHERE story_id=? ORDER BY id DESC LIMIT 1').bind(story.id).first<{fingerprint:string}>();
 if(last?.fingerprint===fingerprint)return [];
 return [db.prepare('INSERT INTO brief_versions(story_id,created_at,expires_at,fingerprint,data) VALUES(?,?,?,?,?)').bind(story.id,now,new Date(expiry).toISOString(),fingerprint,data),db.prepare('DELETE FROM brief_versions WHERE story_id=? AND id NOT IN (SELECT id FROM brief_versions WHERE story_id=? ORDER BY id DESC LIMIT 10)').bind(story.id,story.id)];
}
export async function pruneBriefVersions(db:D1Database,now:string):Promise<void>{await db.batch([db.prepare('DELETE FROM brief_versions WHERE expires_at <= ?').bind(now),db.prepare('DELETE FROM brief_versions WHERE story_id NOT IN (SELECT id FROM stories)')]);}
