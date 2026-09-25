import { createGlass, type GlassController } from '../src/index.js';
import { runChecks } from './checks.js';
const $ = (id: string) => document.getElementById(id)!;
const source = $('source'), stage = $('stage'), lensUI = $('lens');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let x = 50, y = 50, pinned = false, animated = false, enabled = true;
let radius = 36, frame = 0, controller: GlassController;
function geometry() {
  const w = Math.min(236, stage.clientWidth - 32), h = 140;
  return { x: 12 + (stage.clientWidth - w - 24) * x / 100,
    y: 12 + (stage.clientHeight - h - 24) * y / 100, width: w, height: h, radius };
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
  Object.assign(lensUI.style, { left: `${lens.x}px`, top: `${lens.y}px`, width: `${lens.width}px`, height: `${lens.height}px`, borderRadius: `${lens.radius}px` });
  controller?.update({ lens });
  ($('x') as HTMLInputElement).value = String(x); ($('y') as HTMLInputElement).value = String(y);
  $('x-value').textContent = `${Math.round(x)}%`; $('y-value').textContent = `${Math.round(y)}%`;
  requestAnimationFrame(() => requestAnimationFrame(diagnostics));
}
controller = createGlass(source, { lens: geometry(), strength: 24, bevel: 30,
  onStatus: () => requestAnimationFrame(diagnostics) });
move();
for (const key of ['strength', 'bevel', 'radius', 'blur']) {
  $(key).addEventListener('input', () => {
    const value = Number(($(key) as HTMLInputElement).value);
    $(`${key}-value`).textContent = `${value} px`;
    if (key === 'radius') { radius = value; move(); }
    else controller.update({ [key]: value });
    requestAnimationFrame(() => requestAnimationFrame(diagnostics));
  });
}
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
  for (const [key, val] of Object.entries({ strength: 24, bevel: 30, radius: 36, blur: 0 })) {
    ($(key) as HTMLInputElement).value = String(val); $(`${key}-value`).textContent = `${val} px`;
  }
  controller.update({ strength: 24, bevel: 30, blur: 0, enabled });
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
