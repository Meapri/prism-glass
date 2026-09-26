import {readdir} from 'node:fs/promises';
export async function publicDocuments(){
 const docs=(await readdir(new URL('../docs/',import.meta.url))).filter(name=>/^[A-Z0-9_]+\.(md|txt|json)$/.test(name)).map(name=>'docs/'+name);
 const recipes=(await readdir(new URL('../examples/recipes/',import.meta.url))).filter(name=>/^[A-Za-z0-9-]+\.(md|tsx?)$/.test(name)).map(name=>'examples/recipes/'+name);
 return ['llms.txt','llms-full.txt','api.json','README.md','README.ko.md','CHANGELOG.md',...docs,...recipes];
}
export const documentMime=name=>name.endsWith('.json')?'application/json; charset=utf-8':'text/plain; charset=utf-8';
