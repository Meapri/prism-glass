import type { GlassAppearance, GlassVariant } from './materials.js';
import type { GlassAppearanceMode } from './adaptive.js';
import type { GlassSurfacePreset } from './surface-presets.js';
import type { GlassMaterial } from './materials.js';
import type { Lens, SurfaceProfile, BlurMode } from './optics.js';

export type GlassMediaSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
export interface MediaLens {
  id: string;
  lens: Lens;
  variant?: GlassVariant;
  appearance?: GlassAppearanceMode;
  fallbackAppearance?: GlassAppearance;
  preset?: GlassSurfacePreset;
  /** Called outside React render; use to keep foreground and GPU appearance together. */
  onAppearance?: (state:{appearance:GlassAppearance;material:GlassMaterial;elevation:number;available:boolean;separation:number})=>void;
  /** Web analogue of the iOS 27 appearance preference: 0 clearer, 1 more tinted. */
  tintLevel?: number;
  strength?: number;
  bevel?: number;
  ior?: number;
  surface?: SurfaceProfile;
  depth?: number;
  curvature?: number;
  blurMode?: BlurMode;
  blur?: number;
  saturation?: number;
  highlight?: number;
  /** Chromatic fringe in CSS pixels, 0–3. */
  chroma?: number;
  /** Local dimming under clear controls; defaults to 0.35. Set 0 for already-dark media. */
  dimming?: number;
  /** Touch lighting, 0–1. Changes do not rebuild the optical map. */
  press?: number;
  hover?: number;
  pointer?: readonly [number, number];
}
export type MediaLensPatch = Partial<Omit<MediaLens, 'id' | 'lens'>> & { lens?: Partial<Lens> };
export interface MediaGlassOptions {
  lenses?: readonly MediaLens[];
  fit?: 'cover' | 'contain' | 'fill';
  /** Align with the visible media's object-position, normalized 0–1. */
  position?: readonly [number, number];
  /** RGB channels in 0–1, matching the visible media's background/letterbox. Default black. */
  backgroundColor?: readonly [number, number, number];
  resolution?: number;
  /** Maximum backing-store DPR. Default 2. */
  pixelRatio?: number;
  maxPixels?: number;
  enabled?: boolean;
  /** Repaint self-animating canvas sources; video uses frame callbacks automatically. */
  live?: boolean;
  respectPreferences?: boolean;
  onStatus?: (diagnostics: MediaGlassDiagnostics) => void;
}
export interface MediaGlassDiagnostics {
  state: 'loading' | 'ready' | 'paused' | 'disabled' | 'fallback' | 'error' | 'destroyed';
  reason: string;
  renderer: 'webgl-media';
  lenses: number;
  mapBuilds: number;
  textureUploads: number;
  renders: number;
  pixels: number;
  visualSupportVerified: false;
}
export interface MediaGlassController {
  setLenses(lenses: readonly MediaLens[]): void;
  updateLens(id: string, patch: MediaLensPatch): void;
  update(patch: Partial<Omit<MediaGlassOptions, 'lenses'>>): void;
  refresh(): void;
  getDiagnostics(): MediaGlassDiagnostics;
  destroy(): void;
}
