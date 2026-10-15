import {SOURCES} from '../lib/sources';
import {fetchItems,makeStory} from '../lib/news';
for(const id of ['fed','ons','bbc-business']){const source=SOURCES.find(s=>s.id===id)!;try{const items=await fetchItems(source);const item=items.find(i=>/statement|inflation|GDP/.test(i.title))??items[0];const brief=item?await makeStory(item,source,new Date().toISOString()):null;console.log(JSON.stringify({source:id,count:items.length,brief},null,2));}catch(e){console.log(id,String(e));}}
