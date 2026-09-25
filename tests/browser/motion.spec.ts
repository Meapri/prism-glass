import {test,expect,type Page} from '@playwright/test';
import {build} from 'esbuild';import {readFile} from 'node:fs/promises';import {PNG} from 'pngjs';
let script:string,styles:string;
test.beforeAll(async()=>{styles=await readFile('src/styles.css','utf8');script=(await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
 import React,{useRef,useState}from'react';import{createRoot}from'react-dom/client';
 import{GlassButton,GlassPresence,GlassLightGroup,GlassMediaScene,GlassPopover}from'./src/react.tsx';
 import{createGlassPresence,bindGlassInteraction}from'./src/index.ts';
 window.createPresence=createGlassPresence;window.bindInteraction=bindGlassInteraction;window.phases=[];
 function App(){const source=useRef(null),[shown,setShown]=useState(false),[disabled,setDisabled]=useState(false);window.setShown=setShown;window.setDisabled=setDisabled;
 const shape={width:150,height:64,'--prism-control-height':'100%'};
 return <><GlassLightGroup style={{display:'flex',gap:18}}><GlassButton data-testid="css-press" onPointerDown={e=>window.lastPointerId=e.pointerId} appearance="dark" disabled={disabled} style={shape}>Press</GlassButton><GlassButton data-testid="neighbor" appearance="dark" style={shape}>Neighbor</GlassButton></GlassLightGroup>
 <GlassLightGroup><GlassButton data-testid="isolated" appearance="dark">Other group</GlassButton></GlassLightGroup>
 <GlassMediaScene className="scene" source={source} appearance="dark" variant="regular" style={{width:480,height:240,borderRadius:0}}>
 <canvas ref={node=>{source.current=node;if(node){const ctx=node.getContext('2d');ctx.fillStyle='#182338';ctx.fillRect(0,0,480,240);}}} width={480} height={240} style={{position:'absolute',inset:0,width:480,height:240}}/>
 <GlassLightGroup className="prism-media-controls"><GlassButton data-testid="gpu-press" style={{...shape,position:'absolute',left:25,top:22}}>GPU</GlassButton><GlassButton data-testid="gpu-neighbor" style={{...shape,position:'absolute',left:195,top:22}}>Nearby</GlassButton>
 <GlassPresence data-testid="gpu-presence" present={shown} preset="popover" onPresenceChange={phase=>window.phases.push(phase)} style={{position:'absolute',left:30,top:115,width:350,height:100}}>Material forms</GlassPresence></GlassLightGroup></GlassMediaScene>
 <GlassPresence data-testid="css-presence" present={shown} preset="popover" style={{width:350,height:110}}><GlassButton data-testid="presence-child">Action</GlassButton></GlassPresence>
 <GlassPopover trigger="Open motion popover" aria-label="Motion options"><button type="button" onClick={e=>e.currentTarget.closest('[popover]').hidePopover()}>Done</button></GlassPopover></>}
 const root=createRoot(document.getElementById('root'));window.unmount=()=>root.unmount();root.render(<React.StrictMode><App/></React.StrictMode>);
 `},bundle:true,jsx:'automatic',format:'iife',write:false})).outputFiles[0].text;});
async function fixture(page:Page){await page.setContent('<style>body{margin:20px;background:#25314a;font-family:system-ui}#root{display:flex;flex-direction:column;gap:24px}</style><div id="root"></div>');await page.addStyleTag({content:styles});await page.addScriptTag({content:script});await expect(page.getByTestId('css-press')).toBeVisible();await expect(page.locator('.scene')).toHaveAttribute('data-prism-state','ready');}
const variable=(page:Page,id:string,name:string)=>page.getByTestId(id).evaluate((node,key)=>parseFloat((node as HTMLElement).style.getPropertyValue(key)),name);
const brightness=(png:PNG,x:number,y:number)=>{let sum=0,n=0;for(let j=y-4;j<=y+4;j++)for(let i=x-4;i<=x+4;i++){const p=(j*png.width+i)*4;sum+=(png.data[p]+png.data[p+1]+png.data[p+2])/3;n++;}return sum/n;};

test('contact bloom follows the pointer, spreads within its group, and releases on cancel',async({page})=>{
 await fixture(page);const button=page.getByTestId('css-press'),box=(await button.boundingBox())!;
 await page.mouse.move(box.x+15,box.y+30);await page.mouse.down();await expect.poll(()=>variable(page,'css-press','--prism-press')).toBeGreaterThan(.85);
 await expect.poll(()=>variable(page,'neighbor','--prism-near-glow')).toBeGreaterThan(.01);expect(await variable(page,'isolated','--prism-near-glow')).toBe(0);
 await page.mouse.move(box.x+120,box.y+30);await expect.poll(()=>variable(page,'css-press','--prism-light-x')).toBeGreaterThan(70);
 await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerId:(window as any).lastPointerId+1000})));expect(await variable(page,'css-press','--prism-press')).toBeGreaterThan(.8);
 await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:(window as any).lastPointerId})));await expect.poll(()=>variable(page,'css-press','--prism-press')).toBeLessThan(.01);await expect.poll(()=>variable(page,'neighbor','--prism-near-glow')).toBeLessThan(.01);await page.mouse.up();
});

test('SDR media illumination changes actual pixels locally instead of flashing the entire surface',async({page})=>{
 await fixture(page);const button=page.getByTestId('gpu-press');const rest=PNG.sync.read(await button.screenshot({scale:'css'}));const box=(await button.boundingBox())!;
 await page.mouse.move(box.x+20,box.y+32);await page.mouse.down();await expect.poll(()=>variable(page,'gpu-press','--prism-press')).toBeGreaterThan(.95);
 const lit=PNG.sync.read(await button.screenshot({scale:'css'}));const near=brightness(lit,20,32)-brightness(rest,20,32),far=brightness(lit,130,32)-brightness(rest,130,32);
 expect(near).toBeGreaterThan(35);expect(near).toBeGreaterThan(far*2);await expect.poll(()=>variable(page,'gpu-neighbor','--prism-near-glow')).toBeGreaterThan(.01);await page.mouse.up();
});

test('keyboard light is centered, disabled controls do not energize, and cleanup restores caller styles',async({page})=>{
 await fixture(page);const button=page.getByTestId('css-press');await button.focus();await page.keyboard.down('Space');await expect.poll(()=>variable(page,'css-press','--prism-press')).toBeGreaterThan(.8);expect(await variable(page,'css-press','--prism-pointer-x')).toBe(50);await page.keyboard.up('Space');
 await page.evaluate(()=>(window as any).setDisabled(true));await expect.poll(()=>variable(page,'css-press','--prism-press')).toBeLessThan(.01);
 await button.dispatchEvent('pointerdown',{pointerId:7,button:0});expect(await variable(page,'css-press','--prism-press')).toBeLessThan(.01);
 const restored=await page.evaluate(()=>{const node=document.createElement('button');node.style.setProperty('--prism-press','.3');document.body.append(node);const controller=(window as any).bindInteraction(node);controller.destroy();controller.destroy();return node.style.getPropertyValue('--prism-press');});expect(restored).toBe('.3');
});

test('materialize keeps exiting content mounted but inert and supports rapid reversals',async({page})=>{
 await fixture(page);await page.evaluate(()=>(window as any).setShown(true));await expect(page.getByTestId('css-presence')).toHaveAttribute('data-prism-presence','entering');
 await expect(page.getByTestId('gpu-presence')).toHaveAttribute('data-prism-presence','shown');await expect(page.getByTestId('css-presence')).toHaveAttribute('data-prism-presence','shown');
 await page.evaluate(()=>(window as any).setShown(false));await expect(page.getByTestId('css-presence')).toHaveAttribute('inert','');await expect(page.getByTestId('gpu-presence')).toHaveAttribute('aria-hidden','true');
 await page.evaluate(()=>(window as any).setShown(true));await expect(page.getByTestId('gpu-presence')).toHaveAttribute('data-prism-presence','shown');await expect(page.getByTestId('presence-child')).toBeEnabled();
 await page.evaluate(()=>(window as any).setShown(false));await expect(page.getByTestId('gpu-presence')).toHaveCount(0);await expect(page.getByTestId('css-presence')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).phases)).toContain('hidden');
});

test('materialize reversal is continuous and disposal does not overwrite later user styles',async({page})=>{
 await fixture(page);
 await page.evaluate(()=>{const node=document.createElement('div');document.body.append(node);(window as any).presenceNode=node;(window as any).presenceController=(window as any).createPresence(node);(window as any).presenceController.setVisible(true);});
 await expect.poll(()=>page.evaluate(()=>(window as any).presenceController.getState().progress)).toBeGreaterThan(.1);
 const result=await page.evaluate(()=>new Promise<any>(resolve=>requestAnimationFrame(()=>{const c=(window as any).presenceController,before=c.getState().progress;c.setVisible(false);resolve({before,after:c.getState().progress});})));
 expect(Math.abs(result.after-result.before)).toBeLessThan(.12);
 await page.evaluate(()=>{const c=(window as any).presenceController;c.setVisible(true);});await expect.poll(()=>page.evaluate(()=>(window as any).presenceController.getState().phase)).toBe('shown');
 expect(await page.evaluate(()=>{const node=(window as any).presenceNode;node.style.setProperty('--prism-material','.42');(window as any).presenceController.destroy();return node.style.getPropertyValue('--prism-material');})).toBe('.42');
});

test('native popovers animate their material and still dismiss and return focus',async({page})=>{
 await fixture(page);const trigger=page.getByRole('button',{name:'Open motion popover'});await trigger.click();const panel=page.locator('[popover]');await expect(panel).toHaveAttribute('data-prism-presence','shown');await expect(page.getByRole('button',{name:'Done'})).toBeFocused();
 await page.keyboard.press('Escape');await expect(panel).toHaveAttribute('data-prism-presence','hidden');await expect(panel).toBeHidden();await expect(trigger).toBeFocused();
 await trigger.click();await expect(panel).toHaveAttribute('data-prism-presence','shown');await page.getByRole('button',{name:'Done'}).click();await expect(panel).toHaveAttribute('data-prism-presence','hidden');
});

test('reduced motion removes size/foreground blur while retaining fast light feedback',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await fixture(page);await page.evaluate(()=>(window as any).setShown(true));await expect(page.getByTestId('css-presence')).toHaveAttribute('data-prism-presence','shown');
 expect(await variable(page,'css-presence','--prism-content-blur')).toBe(0);expect(await variable(page,'css-presence','--prism-content-scale')).toBe(1);
 const button=page.getByTestId('css-press');await button.focus();await page.keyboard.down('Space');await expect.poll(()=>variable(page,'css-press','--prism-press')).toBe(1);await page.keyboard.up('Space');await expect.poll(()=>variable(page,'css-press','--prism-press')).toBe(0);
});


test('a quick tap has visible feedback even when down and up precede the next frame',async({page})=>{
 await fixture(page);const button=page.getByTestId('css-press');
 await button.click({position:{x:25,y:30}});await expect.poll(()=>variable(page,'css-press','--prism-press')).toBeGreaterThan(.1);
 await expect.poll(()=>variable(page,'css-press','--prism-press')).toBeLessThan(.01);
});

test('CSS and media paths produce comparable SDR light over a uniform backdrop',async({page})=>{
 await fixture(page);const gains:number[]=[];
 for(const id of ['css-press','gpu-press']){
  const button=page.getByTestId(id);const rest=PNG.sync.read(await button.screenshot({scale:'css'})),box=(await button.boundingBox())!;
  await page.mouse.move(box.x+22,box.y+32);await page.mouse.down();await expect.poll(()=>variable(page,id,'--prism-press')).toBeGreaterThan(.99);
  const lit=PNG.sync.read(await button.screenshot({scale:'css'})),base=brightness(rest,22,32);
  gains.push((brightness(lit,22,32)-base)/(255-base));await page.mouse.up();await expect.poll(()=>variable(page,id,'--prism-press')).toBeLessThan(.01);
 }
 expect(Math.abs(gains[0]-gains[1])).toBeLessThan(.15);
});
