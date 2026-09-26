import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const check=process.argv.includes('--check');
const pkg=JSON.parse(await readFile('package.json','utf8'));
const cache=new Map();
const relative=file=>path.relative(process.cwd(),file).split(path.sep).join('/');
const resolveType=(file,specifier)=>path.resolve(path.dirname(file),specifier.replace(/\.js$/,'.d.ts'));

// Read compiler-emitted declarations, never application/demo examples. Limit
// this small reader to forms tsc emits here; runtime export equality below
// rejects omissions when the public API changes.
async function exportsOf(file){
 if(cache.has(file))return cache.get(file);
 const result=new Map();cache.set(file,result);
 const text=await readFile(file,'utf8');
 for(const match of text.matchAll(/^export (?:declare )?(interface|type|function|const|class|let|var) ([A-Za-z_$][\w$]*)\b/gm)){
  const tail=text.slice(match.index),next=tail.slice(match[0].length).search(/^(?:export |import |declare |\/\*\*)/m);
  const declaration=(next<0?tail:tail.slice(0,match[0].length+next)).trim();
  result.set(match[2],{name:match[2],kind:match[1],typeOnly:['type','interface'].includes(match[1]),declarationFile:relative(file),declaration});
 }
 for(const match of text.matchAll(/^export (type )?\{([^}]+)\} from ['"]([^'"]+)['"];?/gm)){
  const exports=await exportsOf(resolveType(file,match[3]));
  for(const raw of match[2].split(',')){
   const typeOnly=Boolean(match[1])||/^\s*type\s/.test(raw),parts=raw.trim().replace(/^type\s+/,'').split(/\s+as\s+/),original=exports.get(parts[0]);
   if(!original)throw new Error(`Unresolved public declaration ${parts[0]} from ${match[3]}`);
   const name=parts[1]??parts[0];result.set(name,{...original,name,typeOnly:typeOnly||original.typeOnly});
  }
 }
 for(const match of text.matchAll(/^export (type )?\* from ['"]([^'"]+)['"];?/gm)){
  for(const [name,value] of await exportsOf(resolveType(file,match[2])))if(name!=='default')result.set(name,{...value,typeOnly:Boolean(match[1])||value.typeOnly});
 }
 return result;
}

const entries=[];
for(const [subpath,entry] of Object.entries(pkg.exports)){
 if(typeof entry!=='object'||!entry.types||!entry.import)continue;
 const exports=[...await exportsOf(path.resolve(entry.types))].map(([,value])=>value).sort((a,b)=>a.name.localeCompare(b.name));
 const runtime=Object.keys(await import(pathToFileURL(path.resolve(entry.import)).href)).sort();
 const declared=exports.filter(item=>!item.typeOnly).map(item=>item.name).sort();
 if(JSON.stringify(runtime)!==JSON.stringify(declared))throw new Error(`Declaration/runtime export mismatch at ${subpath}: ${JSON.stringify({runtime,declared})}`);
 entries.push({import:subpath==='.'?pkg.name:pkg.name+subpath.slice(1),types:entry.types,runtimeExports:runtime,exports});
}
const {glassSurfacePresets}=await import('../dist/index.js');
const manifest={schemaVersion:1,package:pkg.name,version:pkg.version,registryPublished:false,moduleFormat:'esm',reactPeer:pkg.peerDependencies.react,cssImport:`${pkg.name}/styles.css`,entryPoints:entries,presetNames:Object.keys(glassSurfacePresets),contracts:{sourceRequiredForRefraction:true,withoutSource:'css-material',reactEntryHasClientDirective:true,svg:{maximumMapSide:512,coordinateBits:8},media:{defaultMaximumMapSide:1024,maximumMapSide:2048,coordinateBits:16,maximumDisplayDpr:3,sharedFieldPixelBudget:4000000},osServiceRegistration:false}};
const guide=await readFile('docs/AI_INTEGRATION.md','utf8');
const recipes=['ControlsExample.tsx','ConfirmExample.tsx','MediaDock.tsx','plain-media.ts'];
const api=['# Public API reference',`\nGenerated for \`${pkg.name}@${pkg.version}\` from emitted TypeScript declarations and checked against actual runtime exports. Do not edit by hand.`, '\nImport only from the entry points below. Declaration-file paths are for reading types, not supported deep imports. JSX components, hooks and utilities are separate exports; the export count is not a component count. Inherited native React/DOM props remain defined by their declared base types.'];
for(const entry of entries){
 api.push(`\n## ${entry.import}`,`\nRuntime exports (${entry.runtimeExports.length}): ${entry.runtimeExports.map(n=>'`'+n+'`').join(', ')}.`, `\nTypes entry: \`${entry.types}\`.`);
 for(const item of entry.exports)api.push(`\n### ${item.name}\n\n${item.typeOnly?'Type only':'Runtime export'} · declared in \`${item.declarationFile}\`.\n\n\`\`\`ts\n${item.declaration}\n\`\`\``);
}
const reference=api.join('\n')+'\n';
const index=`# Prism Glass\n\n> Reusable source-first Liquid Glass for the web. TypeScript core, optional React components and shared media optics.\n\nPackage: \`${pkg.name}\`, version \`${pkg.version}\`, ESM, React ${pkg.peerDependencies.react} for the React adapter. This alpha is not published to the npm registry; install the supplied tarball. Core/media/optics do not require React.\n\n## Start here\n\n- [Integration guide](docs/AI_INTEGRATION.md): renderer selection, exact import paths, state, accessibility, Next.js boundaries and common mistakes.\n- [Generated API reference](docs/API_REFERENCE.md): public exports and declaration signatures for this version.\n- [Machine-readable API](api.json): versioned entry points, exports, declaration origins and rendering contracts.\n- [Copyable recipes](examples/recipes/README.md): complete components using the installed package, with no demo dependencies.\n- [Consumer verification](docs/INTEGRATION_TESTS.md): isolated tarball install, typecheck, production build and browser checks.\n- [Full context](llms-full.txt): this version's guide, API reference and all recipes in one document.\n\n## Essential constraints\n\nImport \`${pkg.name}/styles.css\` once. Use public imports only. CSS material works without a source; actual refraction requires an explicit DOM/image/video/canvas source. Adaptive appearance is color sampling, not page capture. Keep callbacks and DOM refs inside a Next.js client component. Never invent props or OS-service functionality from screenshots. Inspect the consumer's build and real interaction, not only the demo.\n\n## Optional background\n\n- [HIG coverage](https://github.com/Meapri/prism-glass/blob/main/docs/HIG_COVERAGE.md): the 64-entry design inventory and platform boundaries.\n- [Validation history](https://github.com/Meapri/prism-glass/blob/main/docs/VALIDATION.md): actual tests and unverified devices.\n- [Live catalog](https://meapri.github.io/prism-glass/catalog.html): appearance and interaction reference.\n`;
let full=`# Prism Glass ${pkg.version} — complete integration context\n\nGenerated from the current guide, compiler declarations and checked consumer recipes. Package install status: local tarball; not registry-published.\n\n${guide}\n\n${reference}\n\n# Complete recipes\n`;
for(const name of recipes)full+=`\n## examples/recipes/${name}\n\n\`\`\`${name.endsWith('tsx')?'tsx':'ts'}\n${await readFile(`examples/recipes/${name}`,'utf8')}\`\`\`\n`;
await mkdir('docs',{recursive:true});
for(const [file,content] of [['api.json',JSON.stringify(manifest,null,2)+'\n'],['docs/API_REFERENCE.md',reference],['llms.txt',index],['llms-full.txt',full]]){
 if(check){if(await readFile(file,'utf8')!==content)throw new Error(`Generated guidance is stale: ${file}`);}else await writeFile(file,content);
}
console.log(`${check?'Checked':'Generated'} AI guidance for ${entries.length} public code entry points`);
