import type { GlassOptions } from './types.js';
import type { Lens } from './optics.js';
import { clamp, finite } from './optics.js';

export type GlassVariant = 'regular' | 'clear';
export type GlassAppearance = 'light' | 'dark';
export type GlassTint = readonly [red:number,green:number,blue:number,opacity:number];
export function normalizeGlassTint(tint:GlassTint):GlassTint {
  if(!Array.isArray(tint)||tint.length!==4)throw new TypeError('tint needs four normalized RGBA channels');
  return tint.map(value=>clamp(finite(value,'tint channel'),0,1)) as unknown as GlassTint;
}
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
export function customizeGlassMaterial(material:GlassMaterial,options:{tint?:GlassTint;dimming?:number}):GlassMaterial {
  const tint=options.tint?normalizeGlassTint(options.tint):material.tint;
  const dimming=options.dimming===undefined?material.dimming:clamp(finite(options.dimming,'dimming'),0,1);
  const brightness=material.variant==='clear'&&options.dimming!==undefined?1+(material.brightness-1)*Math.min(1,dimming/.35):material.brightness;
  return {...material,tint,dimming,brightness};
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
    blur: variant === 'clear' ? 1.5 : 4 + tint * 12,
    saturation: variant === 'clear' ? 1.1 : dark ? 2.2 : 1.65,
    brightness: variant === 'clear' ? 1.09 : 1,
    highlight: variant === 'clear' ? 0.7 : dark ? 0.12 : 0.2,
    foreground: variant === 'clear' || dark ? '#ffffff' : '#000000',
    opaque: variant === 'clear' || dark ? '#1c1c1e' : '#f2f2f7',
  };
}

/** Shape-aware diffusion, separated from the optical displacement field. */
export function getLensMaterial(lens:Lens, variant:GlassVariant='regular', appearance:GlassAppearance='light', tintLevel=.5):GlassMaterial {
  const material=getGlassMaterial(variant,appearance,tintLevel);
  if(variant==='regular') {
    const circle=lens.shape==='circle'||lens.shape==='ellipse';
    const factor=circle ? .8 : lens.shape==='capsule'?1.2:appearance==='dark'?1:1.4;
    material.blur=Math.min(24,material.blur*factor);
    // Larger dark reading surfaces need less reflected white and vibrancy than
    // compact controls. Calibrated from both native material and popover scenes.
    if(appearance==='dark'&&!circle&&lens.shape!=='capsule'){
      const extent=clamp((Math.min(lens.width,lens.height)-96)/80,0,1);
      material.tint=[.43-.05*extent,.43-.05*extent,.44-.04*extent,material.tint[3]-.03*extent];
      material.saturation-=.25*extent;
    }
  }
  return material;
}

/** Native capture fitting requires a broad, steep roundover, not a 3px effective rim. */
export function materialOptics(lens: Lens, variant: GlassVariant = 'regular', tintLevel = 0.5, appearance: GlassAppearance = 'light'): GlassOptions {
  const short=Math.min(lens.width,lens.height),bevel=Math.min(short/2,64);
  const material=getLensMaterial(lens,variant,appearance,tintLevel);
  return {lens,surface:'rim',strength:variant==='clear'?Math.min(64,short*.65):Math.min(28,short*.3),bevel,
    ior:1.5,depth:1,curvature:clamp(bevel/8,2,8),blur:material.blur,saturation:material.saturation,blurMode:'uniform',highlight:material.highlight};
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
