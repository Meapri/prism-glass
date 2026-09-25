import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref, type RefObject } from 'react';
import { createGlass } from '../index.js';
import { lensFor, type Lens, type LensShape } from '../optics.js';
import { getGlassMaterial, materialOptics, observeGlassPreferences, type GlassAppearance, type GlassVariant } from '../materials.js';
import { bindGlassInteraction, stepSpring, type GlassInteraction } from '../motion.js';
import type { GlassController, GlassOptions } from '../types.js';
import type { MediaLens } from '../media-types.js';

export interface GlassTheme { variant: GlassVariant; appearance: GlassAppearance; tintLevel: number; nested: boolean }
export const GlassContext = createContext<GlassTheme>({ variant: 'regular', appearance: 'light', tintLevel: 0.5, nested: false });
export interface GlassProviderProps { children: ReactNode; variant?: GlassVariant; appearance?: GlassAppearance | 'auto'; tintLevel?: number }
export function GlassProvider({ children, variant = 'regular', appearance = 'auto', tintLevel = 0.5 }: GlassProviderProps) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (appearance !== 'auto') return;
    return observeGlassPreferences(window, preferences => setDark(preferences.dark));
  }, [appearance]);
  return <GlassContext.Provider value={{ variant, appearance: appearance === 'auto' ? dark ? 'dark' : 'light' : appearance, tintLevel, nested: false }}>{children}</GlassContext.Provider>;
}
export interface MaterialProps {
  variant?: GlassVariant;
  appearance?: GlassAppearance;
  tintLevel?: number;
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
  return { ...inherited, variant: props.variant ?? inherited.variant, appearance: props.appearance ?? inherited.appearance, tintLevel: props.tintLevel ?? inherited.tintLevel };
}
export function materialStyle(theme: GlassTheme): CSSProperties {
  const material = getGlassMaterial(theme.variant, theme.appearance, theme.tintLevel);
  const [r, g, b, a] = material.tint;
  const clearAlpha = 1 - (1 - material.dimming) * (1 - a);
  const clearReflection = a * 255 / Math.max(clearAlpha, 0.001);
  return { '--prism-fill': theme.variant === 'clear' ? `rgb(${clearReflection} ${clearReflection} ${clearReflection} / ${clearAlpha})` : `rgb(${r * 255} ${g * 255} ${b * 255} / ${a})`,
    '--prism-blur': `${material.blur}px`, '--prism-saturation': material.saturation, '--prism-brightness': material.brightness,
    '--prism-ink': material.foreground, '--prism-solid': material.opaque } as CSSProperties;
}
export interface LensSpec {
  id: string;
  variant: GlassVariant;
  appearance: GlassAppearance;
  tintLevel?: number;
  shape?: LensShape;
  radius?: number;
  optics?: MaterialProps['optics'];
  enabled: boolean;
  nested?: boolean;
  local?: boolean;
  animate?: boolean;
  transient?: boolean;
  pressScale?: number;
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
    let current: Lens | undefined, painted: Lens | undefined, destination: Lens | undefined;
    let velocity = { x: 0, y: 0 };
    let interaction: GlassInteraction = { press: 0, hover: 0, pointer: [0.5, 0.5], reducedMotion: false };
    const geometry = () => {
      const next = latest.current, width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      return next.geometry?.(width, height) ?? lensFor(next.shape ?? 'rounded-rect', { x: 0, y: 0, width, height, radius: next.radius ?? 16 });
    };
    function write(lens: Lens) {
      current = lens;
      const scale = 1 + (reducedMotion ? 0 : interaction.press) * (latest.current.pressScale ?? 0);
      painted = { ...lens, x: lens.x + lens.width * (1 - scale) / 2, y: lens.y + lens.height * (1 - scale) / 2,
        width: lens.width * scale, height: lens.height * scale, radius: lens.radius * scale };
      for (const [key, value] of Object.entries({ x: painted.x, y: painted.y, width: painted.width, height: painted.height, radius: painted.radius })) {
        element!.style.setProperty(`--prism-lens-${key}`, `${value}px`);
      }
      if (useMedia) { media!.invalidate(); return; }
      if (!target || !latest.current.enabled) return;
      const options = { ...materialOptics(painted, latest.current.variant, latest.current.tintLevel, latest.current.appearance), ...latest.current.optics, lens: painted };
      if (latest.current.transient) options.enabled = (options.enabled ?? true) && interaction.press > 0.01;
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
      const rect = element.getBoundingClientRect(), bounds = media!.bounds(), lens = painted ?? current ?? geometry();
      if (!bounds || !lens || !rect.width || !rect.height || !element.isConnected || element.closest('[hidden]')) return null;
      return { id: latest.current.id, lens: { ...lens, x: rect.left - bounds.left + lens.x, y: rect.top - bounds.top + lens.y },
        variant: latest.current.variant, appearance: latest.current.appearance, tintLevel: latest.current.tintLevel, ...latest.current.optics,
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
