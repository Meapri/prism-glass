import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMaps, normalizeLens, sampleDisplacement, lensFor } from '../dist/optics.js';
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
test('named shapes fit bounds and keep their geometry contracts', () => {
  const circle = lensFor('circle', { x: 10, y: 20, width: 200, height: 100 });
  assert.deepEqual(circle, { x: 60, y: 20, width: 100, height: 100, radius: 50, shape: 'circle' });
  assert.equal(lensFor('capsule', { x: 0, y: 0, width: 200, height: 60, radius: 2 }).radius, 30);
  assert.throws(() => normalizeLens({ ...circle, width: 120 }));
  assert.throws(() => lensFor('triangle', { x: 0, y: 0, width: 100, height: 100 }));
});
test('circle dome bends radially and is symmetric on both axes', () => {
  const s = { ...shape, ...lensFor('circle', { x: 0, y: 0, width: 100, height: 100 }), surface: 'dome', curvature: 2 };
  const top = sampleDisplacement(50, 10, s), left = sampleDisplacement(10, 50, s);
  assert.ok(top.dy > 0 && left.dx > 0);
  assert.ok(Math.abs(top.dy - left.dx) < 1e-10);
  assert.ok(Math.abs(top.dx) < 1e-10);
  assert.equal(sampleDisplacement(1, 1, s).mask, 0);
});
test('ellipse uses its own silhouette and remains finite at its center', () => {
  const s = { ...shape, shape: 'ellipse' };
  assert.equal(sampleDisplacement(25, 2, s).mask, 0);
  assert.equal(sampleDisplacement(100, 50, s).mask, 1);
  assert.ok(Object.values(sampleDisplacement(100, 50, s)).every(Number.isFinite));
  const a = sampleDisplacement(100, 5, s), b = sampleDisplacement(100, 95, s);
  assert.ok(Math.abs(a.dy + b.dy) < 1e-10);
});
test('dome extends refraction beyond the rim, concave reverses it, and zero depth is flat', () => {
  const point = [100, 30];
  assert.equal(Math.abs(sampleDisplacement(...point, shape).dy), 0);
  const dome = sampleDisplacement(...point, { ...shape, surface: 'dome', curvature: 2 });
  const concave = sampleDisplacement(...point, { ...shape, surface: 'concave', curvature: 2 });
  assert.ok(dome.dy > 0);
  assert.ok(Math.abs(dome.dy + concave.dy) < 1e-10);
  assert.equal(Math.abs(sampleDisplacement(100, 1, { ...shape, depth: 0 }).dy), 0);
});
test('center and edge frosting are complementary and masks stay within the lens', () => {
  for (const y of [1, 5, 10, 20, 50]) {
    const center = sampleDisplacement(100, y, { ...shape, blurMode: 'center' });
    const edge = sampleDisplacement(100, y, { ...shape, blurMode: 'edge' });
    assert.ok(Math.abs(center.frost + edge.frost - 1) < 1e-10);
  }
  assert.equal(sampleDisplacement(100, 50, { ...shape, blurMode: 'edge' }).frost, 0);
  assert.equal(sampleDisplacement(0, 0, { ...shape, blurMode: 'center' }).frost, 0);
  assert.equal(generateMaps(shape).frost, undefined);
  assert.equal(generateMaps({ ...shape, blurMode: 'center' }).frost.length, 200 * 100 * 4);
});
test('surface parameters and material names are validated before map generation', () => {
  for (const extra of [{ depth: NaN }, { depth: -1 }, { curvature: 1 }, { surface: 'unknown' }, { blurMode: 'unknown' }]) {
    assert.throws(() => generateMaps({ ...shape, ...extra }));
  }
});
test('component presets scale to their lens and keep slider refraction gentler', async () => {
  const { getGlassPreset } = await import('../dist/index.js');
  const lens = lensFor('capsule', { x: 0, y: 0, width: 90, height: 60 });
  assert.ok(getGlassPreset('slider', lens).strength < getGlassPreset('switch', lens).strength);
  for (const name of ['button', 'switch', 'slider', 'tab', 'panel']) {
    const config = getGlassPreset(name, lens);
    assert.doesNotThrow(() => generateMaps({ ...config, ...config.lens }));
  }
});
test('core and React adapter import safely without window/document', async () => {
  const core=await import('../dist/index.js');assert.equal(typeof core.createGlass,'function');
  const React=await import('react'); const {renderToString}=await import('react-dom/server');
  const {GlassSource}=await import('../dist/react.js');
  const html=renderToString(React.createElement(GlassSource,{glass:{lens:{x:0,y:0,width:100,height:50,radius:10}}},'Live content'));
  assert.match(html,/Live content/);assert.ok(!html.includes('filter='));
});
