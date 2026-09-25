import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
let fixtureCode:string, styles:string;
test.beforeAll(async()=>{
  styles=await readFile('src/styles.css','utf8');
  const result=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
    import React,{StrictMode,useRef} from 'react';import{createRoot}from'react-dom/client';
    import{GlassButton,GlassSwitch,GlassSlider,GlassTabs,GlassMediaScene}from'./src/react.tsx';
    let root;function Collection(){const source=useRef(null);return <>
      <GlassButton refractionTarget={<span>Live background</span>}>DOM control</GlassButton>
      <GlassSwitch aria-label="Fixture switch" defaultChecked />
      <GlassSlider aria-label="RTL slider" dir="rtl" defaultValue={25} />
      <GlassTabs aria-label="RTL tabs" dir="rtl" items={[{value:'a',label:'First'},{value:'b',label:'Disabled',disabled:true},{value:'c',label:'Last'}]} />
      <GlassMediaScene source={source} style={{width:320,height:180}} media={{onStatus:d=>window.fixtureMediaState=d.state}}>
        <canvas ref={node=>{source.current=node;if(node){const c=node.getContext('2d');c.fillStyle='green';c.fillRect(0,0,320,180);}}} width={320} height={180} style={{position:'absolute',inset:0}} />
        <div className="prism-media-controls"><GlassButton shape="circle" style={{position:'absolute',left:120,top:60}}>M</GlassButton></div>
      </GlassMediaScene></>;}
    window.mountFixture=()=>{root=createRoot(document.querySelector('#fixture'));root.render(<StrictMode><Collection /></StrictMode>);};
    window.unmountFixture=()=>root.unmount();
  `},bundle:true,format:'iife',jsx:'automatic',write:false,target:'es2022'});
  fixtureCode=result.outputFiles[0].text;
});

test('StrictMode cleanup releases DOM and media owners and supports remounting',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setContent('<div id="fixture"></div>');await page.addStyleTag({content:styles});await page.addScriptTag({content:fixtureCode});
  await page.evaluate(()=> (window as any).mountFixture());
  await expect.poll(()=>page.evaluate(()=> (window as any).fixtureMediaState)).toBe('ready');
  await expect(page.locator('[data-prism-defs]')).toHaveCount(4);
  await page.getByRole('switch',{name:'Fixture switch'}).click();await expect(page.getByRole('switch',{name:'Fixture switch'})).toHaveAttribute('aria-checked','false');
  await page.evaluate(()=> (window as any).unmountFixture());await expect(page.locator('[data-prism-defs]')).toHaveCount(0);await expect(page.locator('#fixture')).toBeEmpty();
  await page.evaluate(()=> (window as any).mountFixture());await expect.poll(()=>page.evaluate(()=> (window as any).fixtureMediaState)).toBe('ready');
  await expect(page.locator('[data-prism-defs]')).toHaveCount(4);expect(errors).toEqual([]);
});

test('RTL selection follows visual direction and keyboard navigation skips disabled tabs',async({page})=>{
  await page.setContent('<div id="fixture"></div>');await page.addStyleTag({content:styles});await page.addScriptTag({content:fixtureCode});await page.evaluate(()=> (window as any).mountFixture());
  const first=page.getByRole('tab',{name:'First',exact:true});await first.focus();await page.keyboard.press('ArrowLeft');
  const last=page.getByRole('tab',{name:'Last',exact:true});await expect(last).toBeFocused();await expect(last).toHaveAttribute('aria-selected','true');
  await expect.poll(()=>page.locator('.prism-tabs').evaluate(node=>parseFloat((node as HTMLElement).style.getPropertyValue('--prism-lens-x')))).toBeLessThan(5);
  const slider=page.locator('.prism-slider');await expect.poll(()=>slider.evaluate(node=>parseFloat((node as HTMLElement).style.getPropertyValue('--prism-lens-x')))).toBeGreaterThan(130);
});


test('a temporarily collapsed tab layout does not produce invalid optical geometry',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setContent('<div id="fixture"></div>');await page.addStyleTag({content:styles});await page.addScriptTag({content:fixtureCode});await page.evaluate(()=>(window as any).mountFixture());
 await expect(page.getByRole('tab',{name:'First',exact:true})).toBeVisible();
 await page.locator('.prism-tabs').evaluate(node=>{(node as HTMLElement).style.width='2px';});
 await expect.poll(()=>page.locator('.prism-tabs').evaluate(node=>parseFloat((node as HTMLElement).style.getPropertyValue('--prism-lens-width')))).toBeLessThan(1);
 expect(errors).toEqual([]);
});
