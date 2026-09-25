import test from 'node:test';
import assert from 'node:assert/strict';
import {getGlassMaterial, materialOptics, stepSpring, observeGlassPreferences} from '../dist/index.js';
import {generateMaps, sampleDisplacement} from '../dist/optics.js';

test('regular and clear provide different legibility treatments', () => {
  const regular=getGlassMaterial('regular'), clear=getGlassMaterial('clear');
  assert.ok(regular.blur>clear.blur); assert.ok(regular.tint[3]>clear.tint[3]);
  assert.equal(clear.dimming,.35); assert.equal(clear.foreground,'#ffffff');
  assert.equal(getGlassMaterial('regular','dark').foreground,'#ffffff');
  assert.throws(()=>getGlassMaterial('unknown'));
  const lens={x:0,y:0,width:80,height:44,radius:22};
  assert.doesNotThrow(()=>generateMaps({...materialOptics(lens),...lens}));
});
test('spring settles after variable frame times and survives background-tab gaps', () => {
  let state={value:0,velocity:0};
  for(let i=0;i<240;i++) state=stepSpring(state,1,i===20?10:i%2?1/60:1/120);
  assert.deepEqual(state,{value:1,velocity:0});
  for(let i=0;i<240;i++) state=stepSpring(state,0,1/60);
  assert.deepEqual(state,{value:0,velocity:0});
  assert.throws(()=>stepSpring(state,NaN,1/60));
  assert.throws(()=>stepSpring(state,1,-1));
});
test('preference observers share listeners and detach after the final subscriber', () => {
  const entries=[];
  const fakeWindow={matchMedia(query){const listeners=new Set();const entry={query,matches:false,addEventListener:(_,cb)=>listeners.add(cb),removeEventListener:(_,cb)=>listeners.delete(cb),listeners};entries.push(entry);return entry;}};
  let first,second;
  const stop1=observeGlassPreferences(fakeWindow,p=>first=p), stop2=observeGlassPreferences(fakeWindow,p=>second=p);
  assert.equal(entries.length,5);assert.ok(entries.every(q=>q.listeners.size===1));
  const motion=entries.find(q=>q.query.includes('reduced-motion'));motion.matches=true;for(const cb of motion.listeners)cb();
  assert.equal(first.reducedMotion,true);assert.equal(second.reducedMotion,true);
  stop1();assert.ok(entries.every(q=>q.listeners.size===1));stop2();assert.ok(entries.every(q=>q.listeners.size===0));
});
test('quadrant optimization retains full-grid optics and directional highlights', () => {
  for(const shape of ['rounded-rect','circle','capsule','ellipse'])for(const surface of ['rim','dome','concave']) {
    const input={width:101,height:shape==='circle'?101:63,radius:20,bevel:18,ior:1.5,shape,surface,blurMode:'edge'};
    const maps=generateMaps(input,65);
    const effective={...input,radius:shape==='rounded-rect'?20:Math.min(input.width,input.height)/2};
    for(let y=0;y<maps.height;y++)for(let x=0;x<maps.width;x++){
      const s=sampleDisplacement((x+.5)*input.width/maps.width,(y+.5)*input.height/maps.height,effective),i=(y*maps.width+x)*4;
      const expected=new Uint8ClampedArray([128+127*s.dx,128+127*s.dy,s.mask*255,s.shine*255,s.frost*255]);
      for(const [actual,value] of [[maps.displacement[i],expected[0]],[maps.displacement[i+1],expected[1]],[maps.mask[i+3],expected[2]],[maps.highlight[i+3],expected[3]],[maps.frost[i+3],expected[4]]])assert.ok(Math.abs(actual-value)<=1,`${shape}/${surface} ${x},${y}: ${actual} vs ${value}`);
    }
  }
});
test('all public React components and media API import and render without browser globals', async()=>{
  const React=await import('react');const{renderToString}=await import('react-dom/server');const components=await import('../dist/react.js');const media=await import('../dist/media.js');
  assert.equal(typeof media.createMediaGlass,'function');
  const{GlassProvider,GlassButton,GlassSwitch,GlassSlider,GlassTabs,GlassToolbar,GlassPopover,GlassSurface,GlassMediaScene}=components;
  const output=renderToString(React.createElement(GlassProvider,null,
    React.createElement(GlassButton,null,'Save'),React.createElement(GlassSwitch,{'aria-label':'Enabled',defaultChecked:true}),
    React.createElement(GlassSlider,{'aria-label':'Volume',defaultValue:25}),
    React.createElement(GlassTabs,{'aria-label':'Views',items:[{value:'a',label:'First',content:'First panel'},{value:'b',label:'Second'}]}),
    React.createElement(GlassToolbar,{'aria-label':'Tools'},'Tools'),
    React.createElement(GlassPopover,{trigger:'Options','aria-label':'Options'},'Preferences'),
    React.createElement(GlassSurface,null,'Surface'),React.createElement(GlassMediaScene,{source:React.createRef()},'Media')));
  assert.match(output,/role="switch"/);assert.match(output,/type="range"/);assert.match(output,/role="tabpanel"/);assert.match(output,/popover="auto"/);assert.ok(!output.includes('filter:'));
});

test('tint preference increases diffusion and opacity without changing the clear material',()=>{
  const clear=getGlassMaterial('regular','light',0), tinted=getGlassMaterial('regular','light',1);
  assert.ok(tinted.blur>clear.blur);assert.ok(tinted.tint[3]>clear.tint[3]);
  assert.deepEqual(getGlassMaterial('clear','light',0),getGlassMaterial('clear','light',1));
  assert.throws(()=>getGlassMaterial('regular','light',NaN));
  assert.deepEqual(getGlassMaterial('regular','light',-1),clear);
  assert.deepEqual(getGlassMaterial('regular','light',2),tinted);
});
