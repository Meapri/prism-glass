import {build} from 'esbuild';
import {mkdir,rm,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
execFileSync(process.execPath,['node_modules/typescript/bin/tsc'],{stdio:'inherit'});
const result=await build({entryPoints:['src/index.ts','src/react.tsx','src/optics.ts','src/media.ts'],outdir:'dist',bundle:true,splitting:true,format:'esm',target:'es2022',sourcemap:true,external:['react'],write:false});
for(const output of result.outputFiles){
 let text=output.text;
 // Keep a client boundary only on the React entry. Shared pure modules and the
 // framework-independent entries remain usable in server/build environments.
 if(path.basename(output.path)==='react.js')text='"use client";\n'+text;
 if(path.basename(output.path)==='react.js.map'){const map=JSON.parse(text);map.mappings=';'+map.mappings;text=JSON.stringify(map);}
 await writeFile(output.path,text);
}
for(const [entry,globalName] of [['index','PrismGlass'],['media','PrismGlassMedia']])await build({entryPoints:[`src/${entry}.ts`],outfile:`dist/prism-glass${entry==='media'?'-media':''}.global.js`,bundle:true,format:'iife',globalName,target:'es2022',minify:true});
await copyFile('src/styles.css','dist/styles.css');
await writeFile('dist/styles.css.d.ts','/** Side-effect stylesheet; this is not a CSS module. */\nexport {};\n');
await mkdir('dist/licenses',{recursive:true});
await copyFile('node_modules/lucide-react/LICENSE','dist/licenses/lucide-react.txt');
await import('./generate-ai-docs.mjs');
console.log('Built standalone library, types, styles and AI integration guidance');
