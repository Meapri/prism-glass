import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMediaMaps} from '../dist/media.js';
import {sampleDisplacement} from '../dist/optics.js';

const circle={width:104,height:104,radius:52,shape:'circle',bevel:52,ior:1.5,curvature:6.5};
const decode=(data,i)=>[(data[i]*256+data[i+1]-32768)/32767,(data[i+2]*256+data[i+3]-32768)/32767];

test('16-bit optical fields resolve strong refraction to less than 0.002 CSS pixels',()=>{
 const map=generateMediaMaps(circle,1024,3);let worst=0,previousWorst=0;
 assert.equal(map.width,312);assert.equal(map.height,312);assert.equal(map.precision,16);
 for(let y=0;y<map.height;y+=3)for(let x=0;x<map.width;x+=3){
  const expected=sampleDisplacement((x+.5)/3,(y+.5)/3,circle);if(expected.mask<.99)continue;
  const values=decode(map.displacement,(y*map.width+x)*4);
  for(const [i,name] of ['dx','dy'].entries()){
   worst=Math.max(worst,Math.abs(values[i]-expected[name])*64);
   previousWorst=Math.max(previousWorst,Math.abs(Math.round(expected[name]*127)/127-expected[name])*64);
  }
 }
 assert.ok(worst<.002,`16-bit displacement error ${worst}px`);
 assert.ok(previousWorst>.24,`8-bit comparison must expose the previous quantization (${previousWorst}px)`);
});

test('packed directions interpolate linearly across byte boundaries and have exact neutral values',()=>{
 const flat=generateMediaMaps({...circle,depth:0},128,1);
 for(let i=0;i<flat.displacement.length;i+=4)assert.deepEqual(decode(flat.displacement,i),[0,0]);
 const encode=value=>{const n=Math.round(32768+32767*value);return [n>>>8,n&255];};
 const a=encode(-.35),b=encode(.61),t=.413;
 const mix=a.map((v,i)=>v*(1-t)+b[i]*t);
 const interpolated=(mix[0]*256+mix[1]-32768)/32767;
 assert.ok(Math.abs(interpolated-(-.35*(1-t)+.61*t))<1/32767);
});

test('optical fields keep mirror symmetry, respect resolution caps and reject invalid inputs',()=>{
 const map=generateMediaMaps({...circle,width:103,height:103,radius:51.5},1024,3);
 for(let y=0;y<map.height;y+=7)for(let x=0;x<map.width;x+=7){
  const [dx,dy]=decode(map.displacement,(y*map.width+x)*4);
  const [rx,ry]=decode(map.displacement,((map.height-1-y)*map.width+map.width-1-x)*4);
  assert.ok(Math.abs(dx+rx)<1/32767&&Math.abs(dy+ry)<1/32767);
 }
 assert.equal(generateMediaMaps({...circle,width:8192,height:8192,radius:4096},64,3).width,64);
 for(const args of [[{...circle,ior:NaN}], [circle,Infinity], [circle,1024,0], [{...circle,shape:'triangle'}]])assert.throws(()=>generateMediaMaps(...args));
});
