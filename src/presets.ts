import type { GlassOptions } from './types.js';
import { resolveGlassSurface, type GlassSurfacePreset } from './surface-presets.js';
import type { Lens } from './optics.js';
export type GlassPreset = GlassSurfacePreset | 'switch' | 'slider' | 'tab' | 'panel';

/** Independent starting points, not reproductions of proprietary Aave/Apple parameters. */
export function getGlassPreset(preset: GlassPreset, lens: Lens): GlassOptions {
  const half = Math.min(lens.width, lens.height) / 2;
  const base = { lens, ior: 1.5, depth: 1, curvature: 4, surface: 'rim' as const,
    blurMode: 'uniform' as const, strength: Math.min(7, half * 0.25), bevel: Math.min(9, half * 0.4), blur: 0.5, highlight: 0.28 };
  switch (preset) {
    case 'button': return { ...base, blur: 14, saturation: 1.65 };
    case 'switch': return { ...base, strength: 5, bevel: Math.min(7, half), highlight: 0.38 };
    case 'slider': return { ...base, strength: 3.5, bevel: Math.min(6, half), blur: 0.4 };
    case 'tab': return { ...base, strength: 3, bevel: Math.min(6, half), highlight: 0.2 };
    case 'panel': return { ...base, blur: 14, saturation: 1.65 };
    default: return resolveGlassSurface(preset, lens).optics;
  }
}
