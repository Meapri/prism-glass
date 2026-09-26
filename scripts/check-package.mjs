import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const temporary=await mkdtemp(path.join(tmpdir(),'prism-package-check-'));
try{
 const [packed]=JSON.parse(execFileSync('npm',['pack','--ignore-scripts','--json','--pack-destination',temporary],{encoding:'utf8'}));
 assert.ok(packed.size<750_000,`Archive grew beyond 750KB: ${packed.size}`);
 for(const file of packed.files)assert.ok(!/^(demo|tests|src|node_modules)\/|^docs\/visual\/|\.(png|jpe?g|webp|mp4|swift)$/.test(file.path),`Non-consumer file shipped: ${file.path}`);
 execFileSync('tar',['-xzf',path.join(temporary,packed.filename),'-C',temporary]);
 const root=path.join(temporary,'package'),pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 const manifest=JSON.parse(await readFile(path.join(root,'api.json'),'utf8'));
 assert.equal(manifest.version,pkg.version);assert.equal(manifest.package,pkg.name);
 for(const name of ['llms.txt','llms-full.txt','docs/AI_INTEGRATION.md','docs/API_REFERENCE.md','docs/INTEGRATION_TESTS.md','examples/recipes/ControlsExample.tsx','examples/recipes/MediaDock.tsx','dist/licenses/lucide-react.txt'])assert.ok((await readFile(path.join(root,name),'utf8')).length>0,name);
 for(const [subpath,entry] of Object.entries(pkg.exports))for(const target of typeof entry==='string'?[entry]:Object.values(entry))assert.ok((await readFile(path.join(root,target))).length>0,`${subpath}: ${target}`);
 assert.match(await readFile(path.join(root,'dist/react.js'),'utf8'),/^"use client";/);
 for(const name of ['index','media','optics'])assert.doesNotMatch(await readFile(path.join(root,`dist/${name}.js`),'utf8'),/^['"]use client/);
 async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const p=path.join(directory,entry.name);files.push(...entry.isDirectory()?await walk(p):[p]);}return files;}
 for(const file of await walk(path.join(root,'dist'))){
  if(!file.endsWith('.d.ts'))continue;
  const text=await readFile(file,'utf8');
  for(const [,specifier] of text.matchAll(/(?:from\s*|import\()['"]([^'"]+)['"]/g)){
   if(specifier.startsWith('.'))await readFile(path.resolve(path.dirname(file),specifier.replace(/\.js$/,'.d.ts')));
   else assert.ok(specifier==='react'||specifier.startsWith('react/'),`Unexpected type dependency: ${specifier}`);
  }
 }
 // This extraction has no node_modules and no React. Core-only imports must
 // work without optional React or a browser, not just within the source repo.
 for(const name of ['index','media','optics']){
  const value=await import(pathToFileURL(path.join(root,`dist/${name}.js`)).href);
  const entry=manifest.entryPoints.find(e=>e.types===`./dist/${name}.d.ts`);
  assert.deepEqual(Object.keys(value).sort(),entry.runtimeExports);
 }
 const guide=await readFile(path.join(root,'llms-full.txt'),'utf8');assert.ok(guide.includes(pkg.version));
 execFileSync(process.execPath,['scripts/generate-ai-docs.mjs','--check'],{stdio:'inherit'});
 console.log(JSON.stringify({package:pkg.name,version:pkg.version,archiveBytes:packed.size,unpackedBytes:packed.unpackedSize,files:packed.entryCount,reactFreeCoreImports:true,clientBoundary:true,referenceAssetsExcluded:true}));
}finally{await rm(temporary,{recursive:true,force:true});}
