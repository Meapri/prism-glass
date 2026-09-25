import type { Lens, SurfaceProfile, BlurMode } from './optics.js';
export interface GlassOptions {
  lens: Lens;
  /** Maximum sampling offset in CSS pixels. Default 24; range 0–64. */
  strength?: number;
  /** Refractive index of the single-interface approximation. Default 1.5. */
  ior?: number;
  bevel?: number;
  /** Rim keeps the center flat; dome curves the full lens; concave reverses the bend. */
  surface?: SurfaceProfile;
  /** Relative surface height. 0–4, default 1. */
  depth?: number;
  /** Superellipse surface exponent. 2–8, default 4. */
  curvature?: number;
  blur?: number;
  /** Color diffusion/vibrancy inside the lens. 0–3, default 1. */
  saturation?: number;
  /** Uniform frosting, a frosted center, or a frosted rim with a clear center. */
  blurMode?: BlurMode;
  highlight?: number;
  /** Longest displacement-map side; capped at 512. Independent of DPR. */
  resolution?: number;
  /** Safety budget for the full filtered source, including DPR squared. */
  maxSourcePixels?: number;
  enabled?: boolean;
  /** Force filter-cache invalidation for self-animating DOM. Costs a repaint. */
  live?: boolean;
  respectReducedTransparency?: boolean;
  /** Workaround; 'auto' enables ID refresh in WebKit. */
  refreshFilterId?: 'auto' | 'always' | 'never';
  onStatus?: (diagnostics: GlassDiagnostics) => void;
}
export type GlassPatch = Partial<Omit<GlassOptions, 'lens'>> & { lens?: Partial<Lens> };
export interface GlassDiagnostics {
  state: 'loading' | 'ready' | 'disabled' | 'paused' | 'limited' | 'error' | 'destroyed';
  reason: string;
  renderer: 'svg-source';
  mapBuilds: number;
  renders: number;
  mapGenerationMs: number;
  sourcePixels: number;
  mapSize: [number, number];
  /** This reports the selected path, not pixel correctness or frame rate. */
  visualSupportVerified: false;
}
export interface GlassController {
  update(patch: GlassPatch): void;
  refresh(): void;
  getDiagnostics(): GlassDiagnostics;
  destroy(): void;
}
