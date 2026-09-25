import { clamp, finite } from './optics.js';
import { observeGlassPreferences } from './materials.js';

export interface SpringState { value: number; velocity: number }
/** Semi-implicit spring with bounded substeps, stable after a suspended tab resumes. */
export function stepSpring(state: SpringState, target: number, seconds: number,
  stiffness = 360, damping = 32): SpringState {
  for (const [name, value] of Object.entries({ value: state.value, velocity: state.velocity, target, seconds, stiffness, damping })) finite(value, name);
  if (seconds < 0 || stiffness <= 0 || damping <= 0) throw new RangeError('Invalid spring parameters');
  let { value, velocity } = state;
  let remaining = Math.min(seconds, 0.064);
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120);
    velocity += ((target - value) * stiffness - velocity * damping) * dt;
    value += velocity * dt; remaining -= dt;
  }
  if (Math.abs(value - target) < 0.0005 && Math.abs(velocity) < 0.005) return { value: target, velocity: 0 };
  return { value, velocity };
}

export interface GlassInteraction { press: number; hover: number; pointer: readonly [number, number]; reducedMotion: boolean }
export interface GlassInteractionController { destroy(): void }

/** Pointer + keyboard lighting feedback without moving the hit target or cloning DOM. */
export function bindGlassInteraction(element: HTMLElement, onChange?: (state: GlassInteraction) => void): GlassInteractionController {
  const win = element.ownerDocument.defaultView;
  if (!win) throw new Error('A document window is required');
  let dead = false, frame = 0, lastTime = 0, target = 0, hover = 0, reducedMotion = false;
  let spring: SpringState = { value: 0, velocity: 0 }, pointer: readonly [number, number] = [0.5, 0.5];
  const properties = ['--prism-press', '--prism-pointer-x', '--prism-pointer-y'];
  const initial = properties.map(name => [name, element.style.getPropertyValue(name)] as const);
  const owned = new Map<string, string>();
  const disabled = () => element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true';
  function write() {
    const values = [String(clamp(spring.value, 0, 1)), `${pointer[0] * 100}%`, `${pointer[1] * 100}%`];
    properties.forEach((name, i) => { element.style.setProperty(name, values[i]); owned.set(name, values[i]); });
    onChange?.({ press: clamp(spring.value, 0, 1), hover, pointer, reducedMotion });
  }
  function tick(time: number) {
    frame = 0;
    spring = reducedMotion ? { value: target, velocity: 0 } : stepSpring(spring, target, lastTime ? (time - lastTime) / 1000 : 1 / 60);
    lastTime = time; write();
    if (spring.value !== target || spring.velocity !== 0) frame = win!.requestAnimationFrame(tick);
    else lastTime = 0;
  }
  function schedule() { if (!dead && !frame) frame = win!.requestAnimationFrame(tick); }
  const position = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    pointer = [clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1), clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)];
  };
  const enter = () => { if (!disabled()) { hover = 1; schedule(); } };
  const leave = () => { hover = 0; target = 0; schedule(); };
  const move = (event: PointerEvent) => { if (!disabled()) { position(event); schedule(); } };
  const down = (event: PointerEvent) => { if (!disabled() && event.button === 0) { position(event); target = 1; schedule(); } };
  const up = () => { if (target) { target = 0; schedule(); } };
  const keyDown = (event: KeyboardEvent) => { if (!disabled() && (event.key === ' ' || event.key === 'Enter')) { target = 1; schedule(); } };
  const keyUp = (event: KeyboardEvent) => { if (event.key === ' ' || event.key === 'Enter') up(); };
  const focus = () => { hover = 1; schedule(); };
  element.addEventListener('pointerenter', enter); element.addEventListener('pointerleave', leave);
  element.addEventListener('pointermove', move, { passive: true }); element.addEventListener('pointerdown', down);
  element.addEventListener('keydown', keyDown); element.addEventListener('keyup', keyUp);
  element.addEventListener('focus', focus); element.addEventListener('blur', leave);
  win.addEventListener('pointerup', up); win.addEventListener('pointercancel', leave); win.addEventListener('blur', leave);
  const unsubscribe = observeGlassPreferences(win, preferences => { reducedMotion = preferences.reducedMotion; schedule(); });
  return { destroy() {
    if (dead) return; dead = true; if (frame) win.cancelAnimationFrame(frame); unsubscribe();
    element.removeEventListener('pointerenter', enter); element.removeEventListener('pointerleave', leave);
    element.removeEventListener('pointermove', move); element.removeEventListener('pointerdown', down);
    element.removeEventListener('keydown', keyDown); element.removeEventListener('keyup', keyUp);
    element.removeEventListener('focus', focus); element.removeEventListener('blur', leave);
    win.removeEventListener('pointerup', up); win.removeEventListener('pointercancel', leave); win.removeEventListener('blur', leave);
    for (const [name, value] of initial) if (element.style.getPropertyValue(name) === owned.get(name)) {
      if (value) element.style.setProperty(name, value); else element.style.removeProperty(name);
    }
  } };
}
