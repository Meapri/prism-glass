import {PNG} from 'pngjs';
import {test,expect} from '@playwright/test';import {build} from 'esbuild';import {readFile} from 'node:fs/promises';
let script:string,styles:string;
test.beforeAll(async()=>{styles=await readFile('src/styles.css','utf8');script=(await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
 import React,{useRef,useState}from'react';import{createRoot}from'react-dom/client';
 import{GlassSurface,GlassMediaScene,GlassButton}from'./src/react.tsx';import{createBackdropSampler,observeGlassBackdrop}from'./src/backdrop.ts';
 window.sampler=createBackdropSampler(document);window.observe=observeGlassBackdrop;
 function App(){const source=useRef(null),[mode,setMode]=useState('adaptive'),[live,setLive]=useState(true),[revision,setRevision]=useState(0);window.setMode=setMode;window.setLive=setLive;window.invalidate=()=>setRevision(n=>n+1);return <>
 <div id="dom" style={{position:'relative',width:320,height:100,background:'#111'}}><GlassSurface data-testid="dom" preset="navigation" appearance={mode} style={{position:'absolute',left:30,top:20,width:260,height:60}}>Read clearly <GlassButton data-testid="nested">Action</GlassButton></GlassSurface></div>
 <GlassMediaScene className="scene" source={source} variant="regular" appearance="adaptive" sourceVersion={revision} media={{live}} style={{width:320,height:220}}>
 <canvas id="pixels" width="320" height="220" ref={node=>{source.current=node;if(node&&!node.dataset.painted){node.dataset.painted='true';const ctx=node.getContext('2d');ctx.fillStyle='#111';ctx.fillRect(0,0,160,220);ctx.fillStyle='#fff';ctx.fillRect(160,0,160,220);}}} style={{position:'absolute',inset:0,width:320,height:220}}/>
 <div className="prism-media-controls"><GlassSurface data-testid="left" preset="button" style={{position:'absolute',left:20,top:20,width:110,height:44}}>Left</GlassSurface><GlassSurface data-testid="right" preset="button" style={{position:'absolute',left:185,top:20,width:110,height:44}}>Right</GlassSurface><GlassSurface data-testid="ambient" preset="menu" style={{position:'absolute',left:20,top:90,width:110,height:110}}>Stable text</GlassSurface><GlassSurface data-testid="clear" preset="media" style={{position:'absolute',left:185,top:90,width:110,height:60}}>Clear</GlassSurface></div></GlassMediaScene></>}
 const root=createRoot(document.getElementById('root'));window.unmount=()=>root.unmount();root.render(<App/>);
 `},bundle:true,jsx:'automatic',format:'iife',write:false})).outputFiles[0].text;});
async function fixture(page:any){await page.setContent('<style>body{margin:0}#root{padding:20px}</style><div id="root"></div>');await page.addStyleTag({content:styles});await page.addScriptTag({content:script});}
test('DOM samples stationary background updates; explicit appearance overrides adaptation',async({page})=>{
 await fixture(page);const glass=page.getByTestId('dom');await expect(glass).toHaveAttribute('data-appearance','dark');await expect(glass).toHaveAttribute('data-prism-adaptation','resolved');await expect(page.getByTestId('nested')).toHaveCSS('color','rgb(255, 255, 255)');
 await page.evaluate(()=>{document.getElementById('dom')!.style.background='#fff';});await expect(glass).toHaveAttribute('data-appearance','light');
 await page.evaluate(()=>{(window as any).setMode('dark');});await expect(glass).toHaveAttribute('data-appearance','dark');await expect(glass).toHaveAttribute('data-prism-adaptation','off');
});
test('media adapts each lens from its own pixels and keeps menu and clear semantics',async({page})=>{
 await fixture(page);await expect(page.getByTestId('left')).toHaveAttribute('data-appearance','dark');await expect(page.getByTestId('right')).toHaveAttribute('data-appearance','light');
 await expect(page.getByTestId('ambient')).toHaveAttribute('data-appearance','light');await expect(page.getByTestId('clear')).toHaveAttribute('data-prism-adaptation','clear-static');
 await page.evaluate(()=>{const ctx=(document.getElementById('pixels')as HTMLCanvasElement).getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,160,220);ctx.fillStyle='#111';ctx.fillRect(160,0,160,220);});
 await expect(page.getByTestId('left')).toHaveAttribute('data-appearance','light');await expect(page.getByTestId('right')).toHaveAttribute('data-appearance','dark');await expect(page.getByTestId('ambient')).toHaveAttribute('data-appearance','light');
});
test('CSS gradients and alpha compose; unreadable CSS images report unavailable',async({page})=>{
 await fixture(page);const read=()=>page.evaluate(()=>{const s=(window as any).sampler;s.begin();return s.dom(document.querySelector('[data-testid=dom]'));});
 await page.evaluate(()=>{document.getElementById('dom')!.style.background='linear-gradient(90deg, #fff, #fff)';});expect((await read()).luminance).toBeGreaterThan(.95);
 await page.evaluate(()=>{document.getElementById('dom')!.style.background='linear-gradient(90deg, #000, #000)';});expect((await read()).luminance).toBeLessThan(.01);
 await page.evaluate(()=>{document.body.style.background='#fff';document.getElementById('dom')!.style.background='rgba(0,0,0,.5)';});expect((await read()).luminance).toBeCloseTo(.214,2);
 await page.evaluate(()=>{document.getElementById('dom')!.style.backgroundImage='url(data:image/png;base64,broken)';});expect(await read()).toBeNull();await expect(page.getByTestId('dom')).toHaveAttribute('data-prism-adaptation','unavailable');
});
test('shared DOM observers detach their timer when the final surface unmounts',async({page})=>{
 await page.setContent('<div id="root"></div>');await page.addStyleTag({content:styles});
 await page.evaluate(()=>{const active=new Set<number>();(window as any).adaptiveTimers=active;const set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);window.setInterval=((fn:any,ms:number)=>{const id=set(fn,ms);active.add(id);return id;})as typeof window.setInterval;window.clearInterval=id=>{active.delete(id!);clear(id);};});
 await page.addScriptTag({content:script});await expect(page.getByTestId('dom')).toHaveAttribute('data-prism-adaptation','resolved');expect(await page.evaluate(()=>(window as any).adaptiveTimers.size)).toBe(1);
 await page.evaluate(()=>(window as any).unmount());await expect.poll(()=>page.evaluate(()=>(window as any).adaptiveTimers.size)).toBe(0);
});


test('static canvas invalidation refreshes adaptive samples and the GPU texture',async({page})=>{
 await fixture(page);await expect(page.getByTestId('left')).toHaveAttribute('data-appearance','dark');
 await page.evaluate(()=>{(window as any).setLive(false);const ctx=(document.getElementById('pixels')as HTMLCanvasElement).getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,320,220);(window as any).invalidate();});
 await expect(page.getByTestId('left')).toHaveAttribute('data-appearance','light');
 await expect.poll(async()=>{const png=PNG.sync.read(await page.locator('.scene').screenshot({scale:'css'}));return png.data[(40*png.width+38)*4];}).toBeGreaterThan(210);
});
test('cross-origin image pixels fail closed without throwing or choosing a false background',async({page})=>{
 await page.route('https://pixel.example.test/source.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="white"/></svg>'}));
 await fixture(page);
 const sample=await page.evaluate(async()=>{const image=new Image();image.src='https://pixel.example.test/source.svg';await image.decode();return (window as any).sampler.media(image,{x:0,y:0,width:20,height:20},[0,0,20,20],[0,0,0]);});
 expect(sample).toBeNull();
});
