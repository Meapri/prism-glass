import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,writeFile,mkdir,cp,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
import {chromium,expect} from '@playwright/test';
const execute=promisify(execFile),root=process.cwd();
const temporary=await mkdtemp(path.join(tmpdir(),'prism-consumers-'));
const selected=process.argv.find(v=>v.startsWith('--framework='))?.split('=')[1];
if(selected&&!['core','vite','next'].includes(selected))throw new Error('Expected --framework=core, --framework=vite or --framework=next');
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
async function run(cwd,command,args,label){
 console.log(label);
 try{const result=await execute(command,args,{cwd,env,maxBuffer:16*1024*1024});await writeFile(path.join(cwd===root?temporary:cwd,label.replaceAll(/[^a-z0-9-]/gi,'-')+'.log'),result.stdout+result.stderr);return result.stdout;}
 catch(error){await writeFile(path.join(cwd,'failure.log'),String(error.stdout??'')+String(error.stderr??''));throw new Error(`${label} failed in ${cwd}\n${error.stdout??''}\n${error.stderr??''}`);}
}
const [packed]=JSON.parse(await run(root,'npm',['pack','--ignore-scripts','--json','--pack-destination',temporary],'Pack consumer artifact'));
const archive=path.join(temporary,packed.filename);
async function freePort(){const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
async function browserCheck(cwd,framework){
 const port=await freePort(),command=framework==='next'?['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)]:['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'];
 const child=spawn(process.execPath,command,{cwd,env,stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
 let browser;
 try{
  const url=`http://127.0.0.1:${port}`;let response;
  for(let i=0;i<150;i++){if(child.exitCode!==null)throw new Error(log);try{response=await fetch(url);if(response.ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  if(!response?.ok)throw new Error(`Consumer server did not start\n${log}`);
  browser=await chromium.launch({headless:process.env.PRISM_HEADED!=='1'});
  const page=await browser.newPage({viewport:{width:900,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await expect(page.getByRole('heading',{name:'Installed package consumer'})).toBeVisible();
  if(framework==='next'){await expect(page.getByRole('button',{name:'Server-composed button'})).toBeVisible();await expect(page.getByText('Server material: regular')).toBeVisible();}
  const add=page.getByRole('button',{name:'Add item',exact:true});await expect(add).toHaveCSS('min-height','44px');await expect(add).toHaveCSS('border-radius','999px');await add.click();await expect(page.getByLabel('Item count')).toHaveText('1 items');
  await page.getByRole('switch',{name:'Notifications'}).click();await expect(page.getByRole('switch',{name:'Notifications'})).toHaveAttribute('aria-checked','false');
  const slider=page.getByRole('slider',{name:'Volume'});await slider.focus();await page.keyboard.press('ArrowRight');await expect(page.getByLabel('Volume value')).toHaveText('41%');
  await page.getByRole('button',{name:'Actions',exact:true}).click();await page.getByRole('menuitem',{name:'Save',exact:true}).click();await expect(page.locator('[aria-label="Example controls"] p[role="status"]')).toHaveText('Saved');
  const trigger=page.getByRole('button',{name:'Review removal'});await trigger.click();const dialog=page.getByRole('alertdialog',{name:'Remove saved item?'});await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
  await trigger.click();await dialog.getByRole('button',{name:'Remove',exact:true}).click();await expect(page.getByText('Item removed',{exact:true})).toBeVisible();
  const scene=page.locator('.prism-media-scene');await scene.scrollIntoViewIfNeeded();await expect(scene).toHaveAttribute('data-prism-state','ready',{timeout:15000});
  await page.getByRole('button',{name:'Saved',exact:true}).click();await expect(page.getByLabel('Dock selection')).toHaveText('Saved');
  expect(errors).toEqual([]);await page.screenshot({path:path.join(cwd,'consumer.png'),fullPage:true});
  return {hydrationErrors:errors,controls:true,modalFocus:true,media:'ready'};
 }finally{await browser?.close();child.kill('SIGTERM');await writeFile(path.join(cwd,'server.log'),log);}
}
const results=[];
if(!selected||selected==='core'){
 const cwd=path.join(temporary,'core');await mkdir(cwd,{recursive:true});
 await writeFile(path.join(cwd,'package.json'),JSON.stringify({name:'prism-core-consumer',private:true,type:'module',dependencies:{'@meapri/prism-glass':`file:${archive}`}},null,2));
 await run(cwd,'npm',['install','--ignore-scripts','--no-audit','--no-fund'],'Install core');
 let reactInstalled=true;try{await access(path.join(cwd,'node_modules/react'));}catch{reactInstalled=false;}
 if(reactInstalled)throw new Error('Core-only installation unexpectedly installed React');
 await run(cwd,process.execPath,['--input-type=module','-e',`import assert from 'node:assert/strict';import{getGlassMaterial}from'@meapri/prism-glass';import{generateMediaMaps}from'@meapri/prism-glass/media';import{lensFor}from'@meapri/prism-glass/optics';assert.equal(getGlassMaterial().variant,'regular');assert.equal(typeof generateMediaMaps,'function');assert.equal(lensFor('circle',{x:0,y:0,width:80,height:80}).radius,40);console.log('React-free imports passed');`],'Verify core');
 results.push({framework:'core',reactInstalled:false,imports:true});console.log(JSON.stringify(results.at(-1)));
}
for(const framework of selected?(selected==='core'?[]:[selected]):['vite','next']){
 const cwd=path.join(temporary,framework);await cp(path.join(root,'tests/consumers',framework),cwd,{recursive:true});
 const pkg=JSON.parse(await readFile(path.join(cwd,'package.json'),'utf8'));pkg.dependencies['@meapri/prism-glass']=`file:${archive}`;await writeFile(path.join(cwd,'package.json'),JSON.stringify(pkg,null,2));
 const recipes=path.join(cwd,framework==='next'?'app':'src','recipes');await cp(path.join(root,'examples/recipes'),recipes,{recursive:true});await mkdir(path.join(cwd,'public'),{recursive:true});await cp(path.join(root,'tests/consumers/background.svg'),path.join(cwd,'public/background.svg'));
 await run(cwd,'npm',['install','--ignore-scripts','--no-audit','--no-fund'],'Install '+framework);
 await run(cwd,'npm',['run','build'],'Build '+framework);
 const result={framework,versions:pkg.dependencies,...await browserCheck(cwd,framework)};results.push(result);console.log(JSON.stringify(result));
}
await writeFile(path.join(temporary,'results.json'),JSON.stringify(results,null,2)+'\n');
console.log(`Consumer evidence: ${temporary}`);
