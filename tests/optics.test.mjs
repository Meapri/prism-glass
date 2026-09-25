import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMaps, normalizeLens, sampleDisplacement } from '../dist/optics.js';
const shape = { width: 200, height: 100, radius: 25, bevel: 20, ior: 1.5 };
test('displacement obeys mirror symmetry and moves inward', () => {
  for (let t = 1; t < 19; t++) {
    const left = sampleDisplacement(t, 50, shape), right = sampleDisplacement(200-t,50,shape);
    assert.ok(left.dx > 0); assert.ok(right.dx < 0); assert.ok(Math.abs(left.dx+right.dx)<1e-10);
    const top = sampleDisplacement(100,t,shape), bottom = sampleDisplacement(100,100-t,shape);
    assert.ok(top.dy > 0); assert.ok(Math.abs(top.dy+bottom.dy)<1e-10);
  }
});
test('flat center and refractive index one are neutral', () => {
  assert.ok(Math.abs(sampleDisplacement(100,50,shape).dx)<1e-10);
  assert.ok(Math.abs(sampleDisplacement(100,50,shape).dy)<1e-10);
  assert.ok(Math.abs(sampleDisplacement(1,50,{...shape,ior:1}).dx)<1e-10);
});
test('rounded-corner exterior is transparent', () => {
  assert.equal(sampleDisplacement(1,1,shape).mask,0);
  assert.equal(sampleDisplacement(-1,50,shape).mask,0);
});
test('sampling remains finite at grazing angles and square corners', () => {
  for (const radius of [0,1,25,50]) for (const x of [0,0.000001,1,99,100,199,200]) {
    const s=sampleDisplacement(x,0.000001,{...shape,radius});
    assert.ok(Object.values(s).every(Number.isFinite));
    assert.ok(Math.abs(s.dx)<=1 && Math.abs(s.dy)<=1);
  }
});
test('generated map allocation is bounded independently of source size', () => {
  const m=generateMaps({...shape,width:8192,height:4096},128);
  assert.equal(m.width,128);assert.equal(m.height,64);
  assert.equal(m.displacement.length,128*64*4);
});
test('neutral map channels encode the exact agreed integer', () => {
  const m=generateMaps(shape,200);const i=(50*m.width+100)*4;
  assert.equal(m.displacement[i],128);assert.equal(m.displacement[i+1],128);
  assert.equal(m.mask[i+3],255);
});
test('bad or incomplete geometry fails before allocating', () => {
  for (const width of [0,-1,Infinity,NaN,9000]) assert.throws(()=>generateMaps({...shape,width}));
  assert.throws(()=>normalizeLens({x:0,y:0,width:10,height:10}));
  assert.throws(()=>generateMaps({...shape,ior:0.9}));
  assert.throws(()=>generateMaps({...shape,bevel:0}));
});
test('radius is capped to the smaller half dimension', () => {
  assert.equal(normalizeLens({x:0,y:0,width:200,height:100,radius:100}).radius,50);
});
test('core and React adapter import safely without window/document', async () => {
  const core=await import('../dist/index.js');assert.equal(typeof core.createGlass,'function');
  const React=await import('react'); const {renderToString}=await import('react-dom/server');
  const {GlassSource}=await import('../dist/react.js');
  const html=renderToString(React.createElement(GlassSource,{glass:{lens:{x:0,y:0,width:100,height:50,radius:10}}},'Live content'));
  assert.match(html,/Live content/);assert.ok(!html.includes('filter='));
});
