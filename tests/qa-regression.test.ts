import assert from 'node:assert/strict';
import {test} from 'node:test';
import {groupKey} from '../lib/news';
import {safeUrl,parseFeed} from '../lib/feed';
const item={title:'Rate rises to 4.5%',url:'https://example.com/release',description:'',publishedAt:'2026-10-08T12:00:00Z'};
test('QA: grouping preserves meaning-bearing decimal punctuation',()=>{
 assert.notEqual(groupKey(item),groupKey({...item,title:'Rate rises to 45%'}));
});
test('QA: grouping preserves sign of numerical movement',()=>{
 assert.notEqual(groupKey({...item,title:'GDP growth -5%'}),groupKey({...item,title:'GDP growth 5%'}));
});
test('QA: URLs cannot move to alternate ports on otherwise permitted hosts',()=>{
 assert.equal(safeUrl('https://example.com:8443/internal',['example.com']),null);
});
test('QA: future-dated feed item is excluded without substituting fetch time',()=>{
 const xml='<rss><channel><item><title>Future</title><link>https://example.com/a</link><pubDate>Fri, 9 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>';
 assert.deepEqual(parseFeed(xml,['example.com'],new Date('2026-10-08T12:00:00Z')),[]);
});
