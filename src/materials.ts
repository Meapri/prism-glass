import type { GlassOptions } from './types.js';
import type { Lens } from './optics.js';
import { clamp, finite } from './optics.js';

export type GlassVariant = 'regular' | 'clear';
export type GlassAppearance = 'light' | 'dark';
export interface GlassMaterial {
  variant: GlassVariant;
  appearance: GlassAppearance;
  tint: readonly [number, number, number, number];
  dimming: number;
  chroma: number;
  blur: number;
  saturation: number;
  brightness: number;
  highlight: number;
  foreground: string;
  opaque: string;
}

/** Web material choices derived from public design guidance, not Apple's shader. */
export function getGlassMaterial(variant: GlassVariant = 'regular', appearance: GlassAppearance = 'light', tintLevel = 0.5): GlassMaterial {
  if (variant !== 'regular' && variant !== 'clear') throw new TypeError('Invalid glass variant');
  if (appearance !== 'light' && appearance !== 'dark') throw new TypeError('Invalid glass appearance');
  const dark = appearance === 'dark';
  const tint = clamp(finite(tintLevel, 'tintLevel'), 0, 1);
  return {
    variant, appearance,
    // Calibrated against native iOS 27 captures. These are web approximations,
    // not numeric constants published by Apple (see docs/IOS27_REFERENCE.md).
    tint: variant === 'clear' ? [1, 1, 1, 0.125] : dark ? [0.43, 0.43, 0.44, 0.42 + tint * 0.16] : [1, 1, 1, 0.24 + tint * 0.56],
    dimming: variant === 'clear' ? 0.35 : 0,
    chroma: 0,
    blur: variant === 'clear' ? 2.5 : 8 + tint * 12,
    saturation: variant === 'clear' ? 1.1 : dark ? 2.2 : 1.65,
    brightness: variant === 'clear' ? 1.09 : 1,
    highlight: variant === 'clear' ? 0.7 : dark ? 0.12 : 0.2,
    foreground: variant === 'clear' || dark ? '#ffffff' : '#000000',
    opaque: variant === 'clear' || dark ? '#1c1c1e' : '#f2f2f7',
  };
}

/** Useful defaults for the existing DOM renderer; foreground styling stays separate. */
export function materialOptics(lens: Lens, variant: GlassVariant = 'regular', tintLevel = 0.5, appearance: GlassAppearance = 'light'): GlassOptions {
  const half = Math.min(lens.width, lens.height) / 2;
  const material = getGlassMaterial(variant, appearance, tintLevel);
  return { lens, surface: 'rim', strength: Math.min(7, half * 0.16), bevel: Math.min(9, half * 0.35),
    ior: 1.5, depth: 1, curvature: 4, blur: material.blur, saturation: material.saturation, blurMode: 'uniform', highlight: material.highlight };
}

export interface GlassPreferences {
  reducedMotion: boolean;
  reducedTransparency: boolean;
  increasedContrast: boolean;
  forcedColors: boolean;
  dark: boolean;
}
const queries = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  reducedTransparency: '(prefers-reduced-transparency: reduce)',
  increasedContrast: '(prefers-contrast: more)',
  forcedColors: '(forced-colors: active)',
  dark: '(prefers-color-scheme: dark)',
} as const;
type Subscriber = (preferences: GlassPreferences) => void;
const stores = new WeakMap<Window, { subscribe(callback: Subscriber): () => void }>();

/** Share media-query listeners across controls; no browser access at import time. */
export function observeGlassPreferences(win: Window, callback: Subscriber): () => void {
  let store = stores.get(win);
  if (!store) {
    const subscribers = new Set<Subscriber>();
    const media = Object.entries(queries).map(([key, query]) => [key, win.matchMedia(query)] as const);
    const read = () => Object.fromEntries(media.map(([key, query]) => [key, query.matches])) as unknown as GlassPreferences;
    const notify = () => { const preferences = read(); for (const subscriber of subscribers) subscriber(preferences); };
    store = { subscribe(subscriber) {
      if (!subscribers.size) for (const [, query] of media) query.addEventListener('change', notify);
      subscribers.add(subscriber); subscriber(read());
      return () => {
        subscribers.delete(subscriber);
        if (!subscribers.size) {
          for (const [, query] of media) query.removeEventListener('change', notify);
          stores.delete(win);
        }
      };
    } };
    stores.set(win, store);
  }
  return store.subscribe(callback);
}
