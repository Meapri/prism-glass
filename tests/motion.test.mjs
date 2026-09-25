import test from 'node:test';import assert from 'node:assert/strict';
import {glassLightAt,glassPresenceFrame} from '../dist/index.js';
test('contact light has a bounded bright core, soft bloom and no idle emission',()=>{
 assert.equal(glassLightAt(40,20,240,80,0,[.2,.5]),0);
 const near=glassLightAt(48,40,240,80,1,[.2,.5]),far=glassLightAt(230,40,240,80,1,[.2,.5]);
 assert.ok(near>.6&&near<=.92);assert.ok(far<near/3);
 assert.ok(glassLightAt(230,40,240,80,1,[.95,.5])>near*.9);
});
test('materialize has neutral endpoints and resolves the material separately from its labels',()=>{
 const hidden=glassPresenceFrame(0),shown=glassPresenceFrame(1),middle=glassPresenceFrame(.4);
 for(const key of ['lensing','diffusion','material','edge','contentOpacity']){assert.equal(hidden[key],0);assert.equal(shown[key],1);}
 assert.equal(shown.contentBlur,0);assert.equal(shown.contentScale,1);assert.ok(middle.contentBlur>0);assert.notEqual(middle.contentOpacity,middle.material);
 let prior=hidden;for(let i=1;i<=100;i++){const frame=glassPresenceFrame(i/100);for(const key of ['lensing','diffusion','material','edge','contentOpacity'])assert.ok(frame[key]>=prior[key]&&frame[key]<=1);assert.ok(frame.contentBlur<=prior.contentBlur);prior=frame;}
 assert.throws(()=>glassPresenceFrame(NaN));assert.equal(glassPresenceFrame(-1).progress,0);assert.equal(glassPresenceFrame(2).progress,1);
});
test('reduced motion removes foreground diffusion and size animation, retaining material formation',()=>{
 const frame=glassPresenceFrame(.5,true);assert.equal(frame.contentBlur,0);assert.equal(frame.contentScale,1);assert.ok(frame.material>0&&frame.material<1);
});
