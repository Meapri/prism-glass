import type { GlassOptions } from './types.js';
import type { Lens } from './optics.js';

export type GlassVariant = 'regular' | 'clear';
export type GlassAppearance = 'light' | 'dark';
export interface GlassMaterial {
  variant: GlassVariant;
  appearance: GlassAppearance;
  tint: readonly [number, number, number, number];
  dimming: number;
  chroma: number;
  blur: number;
  highlight: number;
  foreground: string;
  opaque: string;
}

/** Web material choices derived from public design guidance, not Apple's shader. */
export function getGlassMaterial(variant: GlassVariant = 'regular', appearance: GlassAppearance = 'light'): GlassMaterial {
  if (variant !== 'regular' && variant !== 'clear') throw new TypeError('Invalid glass variant');
  if (appearance !== 'light' && appearance !== 'dark') throw new TypeError('Invalid glass appearance');
  const dark = appearance === 'dark';
  return {
    variant, appearance,
    tint: variant === 'clear' ? [1, 1, 1, 0.025] : dark ? [0.06, 0.08, 0.09, 0.66] : [0.98, 0.985, 1, 0.64],
    dimming: variant === 'clear' ? 0.35 : 0,
    chroma: variant === 'clear' ? 0.35 : 0.15,
    blur: variant === 'clear' ? 0.35 : 6,
    highlight: variant === 'clear' ? 0.62 : 0.42,
    foreground: variant === 'clear' || dark ? '#ffffff' : '#17201e',
    opaque: variant === 'clear' || dark ? '#222a27' : '#f2f4f1',
  };
}

/** Useful defaults for the existing DOM renderer; foreground styling stays separate. */
export function materialOptics(lens: Lens, variant: GlassVariant = 'regular'): GlassOptions {
  const half = Math.min(lens.width, lens.height) / 2;
  const material = getGlassMaterial(variant);
  return { lens, surface: 'rim', strength: Math.min(24, half * 0.45), bevel: Math.min(24, half * 0.7),
    ior: 1.5, depth: 1, curvature: 4, blur: material.blur, blurMode: 'uniform', highlight: material.highlight };
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
