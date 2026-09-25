import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { createGlass } from '../index.js';
import { lensFor, type Lens, type LensShape } from '../optics.js';
import { materialOptics, observeGlassPreferences, type GlassAppearance, type GlassVariant } from '../materials.js';
import { bindGlassInteraction, stepSpring, type GlassInteraction } from '../motion.js';
import type { GlassController, GlassOptions } from '../types.js';
import type { MediaLens } from '../media-types.js';

export interface GlassTheme { variant: GlassVariant; appearance: GlassAppearance; nested: boolean }
export const GlassContext = createContext<GlassTheme>({ variant: 'regular', appearance: 'light', nested: false });
export interface GlassProviderProps { children: ReactNode; variant?: GlassVariant; appearance?: GlassAppearance | 'auto' }
export function GlassProvider({ children, variant = 'regular', appearance = 'auto' }: GlassProviderProps) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (appearance !== 'auto') return;
    return observeGlassPreferences(window, preferences => setDark(preferences.dark));
  }, [appearance]);
  return <GlassContext.Provider value={{ variant, appearance: appearance === 'auto' ? dark ? 'dark' : 'light' : appearance, nested: false }}>{children}</GlassContext.Provider>;
}
export interface MaterialProps {
  variant?: GlassVariant;
  appearance?: GlassAppearance;
  /** Explicit, decorative source pixels. With no source, the surface uses CSS material. */
  refractionTarget?: ReactNode;
  optics?: Partial<Omit<GlassOptions, 'lens' | 'onStatus'>>;
}
export const MediaContext = createContext<null | {
  register(id: string, read: () => MediaLens | null): () => void;
  invalidate(): void;
  bounds(): DOMRect | undefined;
}>(null);
export const classes = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(' ');
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value); else if (ref) ref.current = value;
}
export function useControllable<T>(controlled: T | undefined, initial: T, notify?: (value: T) => void) {
  const [internal, setInternal] = useState(initial);
  const value = controlled === undefined ? internal : controlled;
  return [value, (next: T) => { if (controlled === undefined) setInternal(next); notify?.(next); }] as const;
}
export function useTheme(props: MaterialProps) {
  const inherited = useContext(GlassContext);
  return { ...inherited, variant: props.variant ?? inherited.variant, appearance: props.appearance ?? inherited.appearance };
}
export interface LensSpec {
  id: string;
  variant: GlassVariant;
  appearance: GlassAppearance;
  shape?: LensShape;
  radius?: number;
  optics?: MaterialProps['optics'];
  enabled: boolean;
  nested?: boolean;
  local?: boolean;
  animate?: boolean;
  geometry?: (width: number, height: number) => Lens;
}

/** Imperative optical updates keep pointer/spring frames out of React rendering. */
export function useComponentLens(root: RefObject<HTMLElement | null>, source: RefObject<HTMLElement | null>, spec: LensSpec) {
  const media = useContext(MediaContext);
  const useMedia = Boolean(media && !spec.local && !spec.nested && !spec.enabled);
  const latest = useRef(spec); latest.current = spec;
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const element = root.current, target = source.current, win = element?.ownerDocument.defaultView;
    if (!element || !win) return;
    let controller: GlassController | undefined, frame = 0, time = 0, reducedMotion = false;
    let current: Lens | undefined, destination: Lens | undefined;
    let velocity = { x: 0, y: 0 };
    let interaction: GlassInteraction = { press: 0, hover: 0, pointer: [0.5, 0.5], reducedMotion: false };
    const geometry = () => {
      const next = latest.current, width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      return next.geometry?.(width, height) ?? lensFor(next.shape ?? 'rounded-rect', { x: 0, y: 0, width, height, radius: next.radius ?? 16 });
    };
    function write(lens: Lens) {
      current = lens;
      for (const [key, value] of Object.entries({ x: lens.x, y: lens.y, width: lens.width, height: lens.height, radius: lens.radius })) {
        element!.style.setProperty(`--prism-lens-${key}`, `${value}px`);
      }
      if (useMedia) { media!.invalidate(); return; }
      if (!target || !latest.current.enabled) return;
      const options = { ...materialOptics(lens, latest.current.variant), ...latest.current.optics, lens };
      options.strength = (options.strength ?? 0) * (1 + interaction.press * 0.12);
      options.highlight = Math.min(1, (options.highlight ?? 0.4) + interaction.press * 0.18);
      if (!controller) controller = createGlass(target, options); else controller.update(options);
    }
    function tick(now: number) {
      frame = 0; if (!current || !destination) return;
      const dt = time ? (now - time) / 1000 : 1 / 60; time = now;
      const x = stepSpring({ value: current.x, velocity: velocity.x }, destination.x, dt);
      const y = stepSpring({ value: current.y, velocity: velocity.y }, destination.y, dt);
      velocity = { x: x.velocity, y: y.velocity }; write({ ...destination, x: x.value, y: y.value });
      if (x.value !== destination.x || y.value !== destination.y || x.velocity || y.velocity) frame = win!.requestAnimationFrame(tick);
      else time = 0;
    }
    function measure() {
      const next = geometry(); if (!next) return;
      destination = next;
      if (!current || !latest.current.animate || reducedMotion || current.width !== next.width || current.height !== next.height) {
        if (frame) win!.cancelAnimationFrame(frame); frame = 0; time = 0; velocity = { x: 0, y: 0 }; write(next);
      } else if (!frame) frame = win!.requestAnimationFrame(tick);
    }
    refresh.current = measure;
    const unregister = useMedia ? media!.register(spec.id, () => {
      const rect = element.getBoundingClientRect(), bounds = media!.bounds(), lens = current ?? geometry();
      if (!bounds || !lens || !rect.width || !rect.height || !element.isConnected || element.closest('[hidden]')) return null;
      return { id: latest.current.id, lens: { ...lens, x: rect.left - bounds.left + lens.x, y: rect.top - bounds.top + lens.y },
        variant: latest.current.variant, appearance: latest.current.appearance, ...latest.current.optics,
        press: interaction.press, hover: interaction.hover, pointer: interaction.pointer };
    }) : undefined;
    const feedback = bindGlassInteraction(element, next => { interaction = next; if (current) write(current); });
    const unsubscribe = observeGlassPreferences(win, preferences => { reducedMotion = preferences.reducedMotion; measure(); });
    const observer = new win.ResizeObserver(measure); observer.observe(element); measure();
    return () => {
      observer.disconnect(); unregister?.(); unsubscribe(); feedback.destroy(); controller?.destroy();
      if (frame) win.cancelAnimationFrame(frame); refresh.current = () => {};
    };
  }, [root, source, useMedia, media, spec.enabled, spec.nested, spec.id]);
  useEffect(() => { refresh.current(); });
  return spec.nested ? 'overlay' : useMedia ? 'webgl-media' : spec.enabled ? 'svg-source' : 'css-material';
}
