import test from 'node:test';import assert from 'node:assert/strict';
import {updateGlassAdaptation,relativeLuminance,adaptGlassMaterial,summarizeBackdrop,resolveGlassSurface,glassSurfacePresets,getGlassMaterial} from '../dist/index.js';
import {generateMaps} from '../dist/optics.js';
const sample=luminance=>({luminance,variance:0,color:[.5,.5,.5],source:'provided',confidence:1});
test('adaptive appearance is stable near the boundary and accepts a sustained change',()=>{
 let state=updateGlassAdaptation(undefined,sample(.05),0,'light');assert.equal(state.appearance,'dark');
 for(let time=160;time<4000;time+=160){state=updateGlassAdaptation(state,sample(time%320?.23:.26),time,'light');assert.equal(state.appearance,'dark');}
 state=updateGlassAdaptation(state,sample(1),4100,'light');assert.equal(state.appearance,'dark','one bright frame must not flash the label');
 for(let time=4200;time<=4900;time+=100)state=updateGlassAdaptation(state,sample(1),time,'light');
 assert.equal(state.appearance,'light');
 assert.equal(updateGlassAdaptation(state,null,5000,'dark').appearance,'dark');
 assert.equal(updateGlassAdaptation(state,sample(NaN),5100,'light').available,false);
});
test('large surfaces hold their reading appearance while clear bypasses adaptive styling',()=>{
 let state=updateGlassAdaptation(undefined,sample(.01),0,'light','ambient');assert.equal(state.appearance,'light');
 const light=getGlassMaterial('regular','light');assert.ok(adaptGlassMaterial(light,state).tint[3]>light.tint[3]);
 const clear=getGlassMaterial('clear');assert.deepEqual(adaptGlassMaterial(clear,state),clear);
 state=updateGlassAdaptation(state,sample(1),1000,'dark','ambient');assert.equal(state.appearance,'dark');
});
test('samples use linear luminance and capture busy background variance',()=>{
 assert.ok(Math.abs(relativeLuminance([.5,.5,.5])-.214041)<.00001);
 const mixed=summarizeBackdrop([[0,0,0],[1,1,1]],'pixels');assert.equal(mixed.luminance,.5);assert.equal(mixed.variance,.25);
 assert.equal(summarizeBackdrop([],'css'),null);
});
test('surface presets scale optically, keep finite geometry, and differ in curvature',()=>{
 for(const name of Object.keys(glassSurfacePresets))for(const [width,height]of [[60,40],[300,200],[800,640]]){
  const surface=resolveGlassSurface(name,{width,height});assert.ok(surface.lens.radius<=Math.min(surface.lens.width,surface.lens.height)/2);
  assert.ok(surface.optics.bevel<=Math.min(width,height)/2);assert.ok(surface.material.blur<=24);
  assert.doesNotThrow(()=>generateMaps({...surface.optics,...surface.lens},32));
 }
 const navigation=resolveGlassSurface('navigation',{width:300,height:200}),sheet=resolveGlassSurface('sheet',{width:300,height:200});
 assert.ok(sheet.optics.strength>navigation.optics.strength);assert.ok(sheet.optics.bevel>navigation.optics.bevel);assert.ok(sheet.material.blur>navigation.material.blur);
 assert.notEqual(sheet.optics.curvature,navigation.optics.curvature);assert.equal(sheet.adaptation,'ambient');
 assert.throws(()=>resolveGlassSurface('constructor',{width:100,height:100}));assert.throws(()=>resolveGlassSurface('sheet',{width:NaN,height:100}));
});
