import type { GlassAppearance, GlassVariant, GlassTint } from './materials.js';
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
  onAppearance?: (state:{appearance:GlassAppearance;material:GlassMaterial;elevation:number;available:boolean;separation:number;ambient?:readonly[number,number,number]})=>void;
  /** Web analogue of the iOS 27 appearance preference: 0 clearer, 1 more tinted. */
  tintLevel?: number;
  tint?: GlassTint;
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
  /** Neighboring contact illumination, 0–1. */
  illumination?: number;
  illuminationPointer?: readonly [number,number];
  /** Material formation, 0 invisible/optically neutral to 1 fully formed. */
  presence?: number;
  hover?: number;
  pointer?: readonly [number, number];
}
export type MediaLensPatch = Partial<Omit<MediaLens, 'id' | 'lens'>> & { lens?: Partial<Lens> };
export interface MediaGlassOptions {
  lenses?: readonly MediaLens[];
  fit?: 'cover' | 'contain' | 'fill';
  /** Align a separate optical plane (for example a dialog) to the source element's page bounds. */
  sourceAlignment?:'scene'|'element';
  /** Align with the visible media's object-position, normalized 0–1. */
  position?: readonly [number, number];
  /** RGB channels in 0–1, matching the visible media's background/letterbox. Default black. */
  backgroundColor?: readonly [number, number, number];
  /** Longest optical field side: default 1024, maximum 2048. Adapts to DPR and a shared 4M-pixel budget. */
  resolution?: number;
  /** Maximum backing-store DPR. Defaults to the display DPR, capped at 3. */
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
  /** Total currently allocated optical-field pixels (two RGBA textures per pixel). */
  mapPixels:number;
  mapPrecision:16;
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
