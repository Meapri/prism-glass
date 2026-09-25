import { createGlass, lensFor, getGlassPreset, type GlassController, type LensShape, type SurfaceProfile, type BlurMode, type GlassPreset } from '../src/index.js';
import { runChecks } from './checks.js';
const $ = (id: string) => document.getElementById(id)!;
const source = $('source'), stage = $('stage'), lensUI = $('lens');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let x = 50, y = 50, pinned = false, animated = false, enabled = true;
let radius = 36, frame = 0, controller: GlassController;
let shape: LensShape = 'rounded-rect', lensWidth = 236, lensHeight = 140;
function geometry() {
  let w = Math.min(lensWidth, stage.clientWidth - 32), h = Math.min(lensHeight, stage.clientHeight - 24);
  if (shape === 'circle') w = h = Math.min(w, h);
  return lensFor(shape, { x: 12 + (stage.clientWidth - w - 24) * x / 100,
    y: 12 + (stage.clientHeight - h - 24) * y / 100, width: w, height: h, radius });
}
function diagnostics() {
  const d = controller.getDiagnostics();
  $('status').textContent = d.state === 'ready' ? 'SVG source' : d.state;
  $('status').title = d.reason;
  $('builds').textContent = String(d.mapBuilds); $('map-size').textContent = d.mapSize.join(' × ');
  $('map-time').textContent = `${d.mapGenerationMs.toFixed(1)} ms`;
  $('pixel-count').textContent = `${(d.sourcePixels / 1e6).toFixed(2)} MP`;
}
function move() {
  const lens = geometry();
  Object.assign(lensUI.style, { left: `${lens.x}px`, top: `${lens.y}px`, width: `${lens.width}px`, height: `${lens.height}px`, borderRadius: shape === 'ellipse' ? '50%' : `${lens.radius}px` });
  ($('radius') as HTMLInputElement).disabled = shape !== 'rounded-rect';
  ($('radius') as HTMLInputElement).value = String(lens.radius);
  $('radius-value').textContent = `${lens.radius} px`;
  controller?.update({ lens });
  ($('x') as HTMLInputElement).value = String(x); ($('y') as HTMLInputElement).value = String(y);
  $('x-value').textContent = `${Math.round(x)}%`; $('y-value').textContent = `${Math.round(y)}%`;
  requestAnimationFrame(() => requestAnimationFrame(diagnostics));
}
controller = createGlass(source, { lens: geometry(), strength: 24, bevel: 30,
  onStatus: () => requestAnimationFrame(diagnostics) });
move();
for (const key of ['strength', 'bevel', 'radius', 'blur', 'depth', 'curvature', 'highlight']) {
  $(key).addEventListener('input', () => {
    const value = Number(($(key) as HTMLInputElement).value);
    ($('preset') as HTMLSelectElement).value = 'custom';
    $(`${key}-value`).textContent = `${value}${key === 'depth' || key === 'curvature' || key === 'highlight' ? '' : ' px'}`;
    if (key === 'radius') { radius = value; move(); }
    else controller.update({ [key]: value });
    requestAnimationFrame(() => requestAnimationFrame(diagnostics));
  });
}
for (const key of ['width', 'height']) $(key).addEventListener('input', () => {
  const value = Number(($(key) as HTMLInputElement).value);
  if (key === 'width') lensWidth = value; else lensHeight = value;
  if (shape === 'circle') lensWidth = lensHeight = value;
  for (const [name, n] of Object.entries({ width: lensWidth, height: lensHeight })) {
    ($(name) as HTMLInputElement).value = String(n); $(`${name}-value`).textContent = `${n} px`;
  }
  ($('preset') as HTMLSelectElement).value = 'custom'; move();
});
$('shape').addEventListener('change', () => {
  shape = ($('shape') as HTMLSelectElement).value as LensShape;
  ($('preset') as HTMLSelectElement).value = 'custom'; move();
});
$('surface').addEventListener('change', () => {
  controller.update({ surface: ($('surface') as HTMLSelectElement).value as SurfaceProfile });
  ($('preset') as HTMLSelectElement).value = 'custom';
});
$('blur-mode').addEventListener('change', () => {
  controller.update({ blurMode: ($('blur-mode') as HTMLSelectElement).value as BlurMode });
  ($('preset') as HTMLSelectElement).value = 'custom';
});
function applyPreset(name: GlassPreset | 'custom') {
  shape = name === 'button' || name === 'slider' ? 'circle' : name === 'switch' || name === 'tab' ? 'capsule' : 'rounded-rect';
  lensWidth = shape === 'circle' ? 160 : 236; lensHeight = shape === 'circle' ? 160 : name === 'tab' ? 100 : 140;
  radius = 36;
  const options = name === 'custom' ? { lens: geometry(), strength: 24, bevel: 30, blur: 0, depth: 1, curvature: 4, surface: 'rim' as const, blurMode: 'uniform' as const, highlight: 0.55 } : getGlassPreset(name, geometry());
  controller.update(options);
  ($('shape') as HTMLSelectElement).value = shape;
  ($('surface') as HTMLSelectElement).value = options.surface!;
  ($('blur-mode') as HTMLSelectElement).value = options.blurMode!;
  for (const [key, value] of Object.entries({ strength: options.strength!, bevel: options.bevel!, blur: options.blur!, depth: options.depth!, curvature: options.curvature!, highlight: options.highlight!, radius, width: lensWidth, height: lensHeight })) {
    ($(key) as HTMLInputElement).value = String(value);
    $(`${key}-value`).textContent = `${Math.round(value * 100) / 100}${key === 'depth' || key === 'curvature' || key === 'highlight' ? '' : ' px'}`;
  }
  move();
}
$('preset').addEventListener('change', () => applyPreset(($('preset') as HTMLSelectElement).value as GlassPreset | 'custom'));
for (const key of ['x', 'y']) $(key).addEventListener('input', () => {
  if (key === 'x') x = Number(($(key) as HTMLInputElement).value); else y = Number(($(key) as HTMLInputElement).value);
  move();
});
stage.addEventListener('pointermove', event => {
  if (pinned || animated || event.pointerType !== 'mouse') return;
  const r = stage.getBoundingClientRect(), g = geometry();
  x = Math.max(0, Math.min(100, (event.clientX - r.left - g.width / 2 - 12) / (r.width - g.width - 24) * 100));
  y = Math.max(0, Math.min(100, (event.clientY - r.top - g.height / 2 - 12) / (r.height - g.height - 24) * 100));
  move();
});
$('pin').addEventListener('click', () => {
  pinned = !pinned; $('pin').setAttribute('aria-pressed', String(pinned)); $('pin').textContent = pinned ? 'Position pinned' : 'Follow pointer';
});
$('effect').addEventListener('click', () => {
  enabled = !enabled; controller.update({ enabled });
  $('effect').setAttribute('aria-pressed', String(enabled)); $('effect').textContent = enabled ? 'Refraction on' : 'Refraction off';
  requestAnimationFrame(() => requestAnimationFrame(diagnostics));
});
function stopAnimation() { animated = false; cancelAnimationFrame(frame); $('motion').setAttribute('aria-pressed', 'false'); $('motion').textContent = 'Animate lens'; }
$('motion').addEventListener('click', () => {
  if (animated) { stopAnimation(); return; }
  if (reduced.matches) { $('motion').textContent = 'Reduced motion on'; return; }
  animated = true; $('motion').setAttribute('aria-pressed', 'true'); $('motion').textContent = 'Pause motion';
  const start = performance.now();
  function tick(t: number) { if (!animated) return; x = 50 + 42 * Math.sin((t - start) / 1800); y = 50 + 26 * Math.cos((t - start) / 2300); move(); frame = requestAnimationFrame(tick); }
  frame = requestAnimationFrame(tick);
});
reduced.addEventListener('change', () => { if (reduced.matches) stopAnimation(); });
$('reset').addEventListener('click', () => {
  stopAnimation(); x = 50; y = 50; radius = 36; enabled = true;
  ($('preset') as HTMLSelectElement).value = 'custom'; applyPreset('custom');
  controller.update({ enabled });
  $('effect').setAttribute('aria-pressed', 'true'); $('effect').textContent = 'Refraction on'; move();
});
new ResizeObserver(move).observe(stage);
// Crisp labels are siblings of the filtered track. No duplicated interactive DOM.
const tabSource = $('tab-source'), tabShell = $('tab-shell');
let selected = 0;
function tabLens() { const width = (tabSource.clientWidth - 12) / 3; return { x: 6 + selected * width, y: 5, width, height: 42, radius: 11 }; }
const tabsGlass = createGlass(tabSource, { lens: tabLens(), strength: 10, bevel: 12, highlight: 0.7 });
function choose(index: number, focus = false) {
  selected = index; const g = tabLens(); tabsGlass.update({ lens: g });
  tabShell.style.left = `${g.x}px`; tabShell.style.width = `${g.width}px`;
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[role=tab]'));
  buttons.forEach((button, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; });
  if (focus) buttons[index].focus();
  $('tab-description').textContent = `${buttons[index].textContent} selected. Source pixels remain live.`;
}
document.querySelectorAll<HTMLButtonElement>('[role=tab]').forEach((button, index) => {
  button.addEventListener('click', () => choose(index));
  button.addEventListener('keydown', event => {
    const to = event.key === 'ArrowRight' ? (selected + 1) % 3 : event.key === 'ArrowLeft' ? (selected + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
    if (to >= 0) { event.preventDefault(); choose(to, true); }
  });
});
new ResizeObserver(() => choose(selected)).observe(tabSource);
$('run-tests').addEventListener('click', () => runChecks($('test-host'), $('test-results'), $('run-tests') as HTMLButtonElement));

// Small independent source layers keep component labels crisp and filter bounds local.
const buttonSource = $('button-source');
const buttonLens = () => lensFor('circle', { x: (buttonSource.clientWidth - 88) / 2, y: 22, width: 88, height: 88 });
const buttonGlass = createGlass(buttonSource, getGlassPreset('button', buttonLens()));
let pressed = false;
$('glass-button').addEventListener('click', () => {
  pressed = !pressed; $('glass-button').setAttribute('aria-pressed', String(pressed));
  $('glass-button').innerHTML = pressed ? '✓<span>PRESSED</span>' : '＋<span>PRESS</span>';
  buttonGlass.update({ depth: pressed ? 0.5 : 1.2, blur: pressed ? 1.5 : 0.75 });
});
new ResizeObserver(() => buttonGlass.update({ lens: buttonLens() })).observe(buttonSource);
const switchSource = $('switch-source'); let switched = false;
const switchLens = () => lensFor('capsule', { x: switchSource.clientWidth / 2 - 70 + (switched ? 68 : 0), y: 37, width: 72, height: 58 });
const switchGlass = createGlass(switchSource, getGlassPreset('switch', switchLens()));
function updateSwitch() {
  $('glass-switch').setAttribute('aria-checked', String(switched)); $('switch-value').textContent = switched ? 'On' : 'Off';
  $('switch-fill').style.width = switched ? '75%' : '25%';
  switchGlass.update({ lens: switchLens() });
}
$('glass-switch').addEventListener('click', () => { switched = !switched; updateSwitch(); });
new ResizeObserver(updateSwitch).observe(switchSource);
const sliderSource = $('slider-source'); let sliderValue = 50;
const sliderLens = () => lensFor('circle', { x: 14 + (sliderSource.clientWidth - 84) * sliderValue / 100, y: 38, width: 56, height: 56 });
const sliderGlass = createGlass(sliderSource, getGlassPreset('slider', sliderLens()));
function updateSlider() {
  sliderValue = Number(($('glass-slider') as HTMLInputElement).value);
  $('slider-value').textContent = String(sliderValue); $('slider-fill').style.width = `${sliderValue}%`;
  sliderGlass.update({ lens: sliderLens() });
}
$('glass-slider').addEventListener('input', updateSlider);
new ResizeObserver(updateSlider).observe(sliderSource);
