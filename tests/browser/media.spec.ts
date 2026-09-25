import {test,expect,type Page} from '@playwright/test';
import {PNG} from 'pngjs';
import path from 'node:path';
import type {MediaGlassController,MediaLens} from '../../src/media-types.js';

declare global { interface Window {
  PrismGlassMedia:{createMediaGlass:typeof import('../../src/media.js').createMediaGlass};
  mediaFixture:MediaGlassController;
  lossExtension:WEBGL_lose_context;
} }
const lens:MediaLens={id:'first',lens:{x:65,y:35,width:120,height:100,radius:24},variant:'clear',strength:0,blur:0,highlight:0,chroma:0,dimming:0};
async function fixture(page:Page){
  await page.setContent('<style>body{margin:0}#stage{position:relative;width:320px;height:200px;margin:35px}canvas{position:absolute;inset:0;width:320px;height:200px}</style><div id="stage"><canvas id="source" width="320" height="200"></canvas><canvas id="glass"></canvas></div>');
  await page.addScriptTag({path:path.resolve('dist/prism-glass-media.global.js')});
  await page.evaluate(options=>{
    const source=document.querySelector<HTMLCanvasElement>('#source')!,ctx=source.getContext('2d')!;
    for(const [color,x,y] of [['#f02020',0,0],['#20e030',160,0],['#2030f0',0,100],['#e0c020',160,100]] as const){ctx.fillStyle=color;ctx.fillRect(x,y,160,100);}
    ctx.fillStyle='#ffffff';for(let x=20;x<320;x+=20)ctx.fillRect(x,0,3,200);
    // Retain the static WebGL fixture for deterministic software-compositor screenshots.
    document.querySelector<HTMLCanvasElement>('#glass')!.getContext('webgl',{preserveDrawingBuffer:true});
    window.mediaFixture=window.PrismGlassMedia.createMediaGlass(document.querySelector<HTMLCanvasElement>('#glass')!,source,{lenses:[options]});
  },lens);
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().state)).toBe('ready');
}
const pixel=(png:PNG,x:number,y:number)=>Array.from(png.data.subarray((y*png.width+x)*4,(y*png.width+x)*4+3));

test('media coordinates preserve orientation and only refract within the lens',async({page})=>{
  await fixture(page);
  const stage=page.locator('#stage');
  const original=PNG.sync.read(await stage.screenshot({scale:'css'}));
  // The upper and lower parts must sample the corresponding source quadrants.
  const red=pixel(original,125,65),blue=pixel(original,125,120);
  expect(red[0]).toBeGreaterThan(200);expect(red[2]).toBeLessThan(70);
  expect(blue[2]).toBeGreaterThan(200);expect(blue[0]).toBeLessThan(70);
  const renders=await page.evaluate(()=>window.mediaFixture.getDiagnostics().renders);
  await page.evaluate(()=>window.mediaFixture.updateLens('first',{strength:36}));
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().renders)).toBeGreaterThan(renders);
  const bent=PNG.sync.read(await stage.screenshot({scale:'css'}));
  let changed=0,outside=0;
  for(let y=0;y<200;y++)for(let x=0;x<320;x++){
    const i=(y*320+x)*4,delta=[0,1,2].reduce((sum,c)=>sum+Math.abs(original.data[i+c]-bent.data[i+c]),0);
    if(delta>35){changed++;if(x<63||x>187||y<33||y>137)outside++;}
  }
  expect(changed).toBeGreaterThan(100);expect(outside).toBe(0);
});

test('shared maps survive motion and lighting updates; validation is atomic',async({page})=>{
  await fixture(page);
  const initial=await page.evaluate(()=>window.mediaFixture.getDiagnostics());
  await page.evaluate(options=>window.mediaFixture.setLenses([options,{...options,id:'second',lens:{...options.lens,x:195}}]),lens);
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().lenses)).toBe(2);
  await page.evaluate(()=>window.mediaFixture.updateLens('first',{lens:{x:80},press:1,hover:1}));
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().renders)).toBeGreaterThan(initial.renders);
  const after=await page.evaluate(()=>window.mediaFixture.getDiagnostics());
  expect(after.mapBuilds).toBe(initial.mapBuilds);expect(after.textureUploads).toBe(initial.textureUploads);
  expect(await page.evaluate(()=>{try{window.mediaFixture.setLenses([{id:'bad',lens:{x:0,y:0,width:NaN,height:20,radius:4}}]);return false;}catch{return true;}})).toBe(true);
  expect(await page.evaluate(()=>window.mediaFixture.getDiagnostics().lenses)).toBe(2);
  await page.evaluate(()=>window.mediaFixture.setLenses([]));await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().reason)).toBe('no-lenses');
  await page.evaluate(options=>window.mediaFixture.setLenses([options]),lens);
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().mapBuilds)).toBe(after.mapBuilds+1);
  await page.evaluate(()=>{window.mediaFixture.destroy();window.mediaFixture.destroy();});
  expect(await page.evaluate(()=>window.mediaFixture.getDiagnostics().state)).toBe('destroyed');
});

test('material variant updates resolve new defaults and resize respects the pixel budget',async({page})=>{
  await fixture(page);
  await page.evaluate(options=>window.mediaFixture.setLenses([{id:'first',lens:options.lens,variant:'clear'}]),lens);
  const clear=await page.locator('#stage').screenshot();
  await page.evaluate(()=>window.mediaFixture.updateLens('first',{variant:'regular'}));
  const regular=await page.locator('#stage').screenshot();expect(regular.equals(clear)).toBe(false);
  await page.evaluate(()=>{window.mediaFixture.update({maxPixels:10000,pixelRatio:3});const canvas=document.querySelector<HTMLCanvasElement>('#glass')!;canvas.style.width='500px';canvas.style.height='400px';});
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().reason)).toBe('pixel-budget-downsampled');
  expect(await page.evaluate(()=>window.mediaFixture.getDiagnostics().pixels)).toBeLessThanOrEqual(10000);
});

test('WebGL context loss exposes fallback and restores its resources',async({page})=>{
  await fixture(page);
  const supported=await page.evaluate(()=>{const gl=document.querySelector<HTMLCanvasElement>('#glass')!.getContext('webgl')!;window.lossExtension=gl.getExtension('WEBGL_lose_context')!;return Boolean(window.lossExtension);});
  test.skip(!supported,'This engine does not expose the context-loss testing extension');
  await page.evaluate(()=>window.lossExtension.loseContext());
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().reason)).toBe('webgl-context-lost');
  await page.evaluate(()=>window.lossExtension.restoreContext());
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().state)).toBe('ready');
});

test('contain sampling retains the configured letterbox instead of stretching edge pixels',async({page})=>{
  await fixture(page);
  await page.evaluate(()=>{
    const stage=document.querySelector<HTMLElement>('#stage')!;stage.style.height='320px';stage.style.background='#224266';
    for(const canvas of document.querySelectorAll('canvas')){canvas.style.height='320px';canvas.style.objectFit='contain';}
    window.mediaFixture.update({fit:'contain',backgroundColor:[34/255,66/255,102/255]});
  });
  const result=PNG.sync.read(await page.locator('#stage').screenshot({scale:'css'}));
  const color=pixel(result,125,45);
  for(const [value,expected] of color.map((value,i)=>[value,[64,98,135][i]]))expect(Math.abs(value-expected)).toBeLessThan(12);
});

test('broad diffusion blends nearby colors and retains vertical orientation',async({page})=>{
  await fixture(page);
  const renders=await page.evaluate(()=>window.mediaFixture.getDiagnostics().renders);
  await page.evaluate(()=>window.mediaFixture.updateLens('first',{blur:14,strength:0,saturation:1}));
  await expect.poll(()=>page.evaluate(()=>window.mediaFixture.getDiagnostics().renders)).toBeGreaterThan(renders);
  const png=PNG.sync.read(await page.locator('#stage').screenshot({scale:'css'}));
  const upper=pixel(png,130,65),lower=pixel(png,130,122),boundary=pixel(png,130,100);
  expect(upper[0]-upper[2]).toBeGreaterThan(100);expect(lower[2]-lower[0]).toBeGreaterThan(100);
  expect(boundary[0]).toBeGreaterThan(80);expect(boundary[2]).toBeGreaterThan(80);
  // A continuous Gaussian must suppress the repeated 3px white bars; sparse taps leave ghosts.
  let maxStep=0;
  for(let x=98;x<144;x++)maxStep=Math.max(maxStep,Math.abs(pixel(png,x,70)[1]-pixel(png,x+1,70)[1]));
  expect(maxStep).toBeLessThan(9);
});
