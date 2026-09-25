import type { GlassOptions } from './types.js';
import type { Lens } from './optics.js';
export type GlassPreset = 'button' | 'switch' | 'slider' | 'tab' | 'panel';

/** Independent starting points, not reproductions of proprietary Aave/Apple parameters. */
export function getGlassPreset(preset: GlassPreset, lens: Lens): GlassOptions {
  const half = Math.min(lens.width, lens.height) / 2;
  const base = { lens, ior: 1.5, depth: 1, curvature: 4, surface: 'rim' as const,
    blurMode: 'uniform' as const, strength: 24, bevel: Math.min(30, half), blur: 0, highlight: 0.4 };
  switch (preset) {
    case 'button': return { ...base, surface: 'dome', curvature: 2.4, depth: 1.2,
      strength: Math.min(20, half * 0.4), bevel: half * 0.55, blur: 0.75, blurMode: 'edge' };
    case 'switch': return { ...base, surface: 'dome', curvature: 3, depth: 1.3,
      strength: Math.min(22, half * 0.55), bevel: half * 0.65, blur: 1, blurMode: 'center', highlight: 0.5 };
    case 'slider': return { ...base, surface: 'dome', curvature: 3,
      strength: Math.min(8, half * 0.18), bevel: half * 0.4, blur: 0.5, blurMode: 'edge' };
    case 'tab': return { ...base, strength: Math.min(12, half * 0.3), bevel: half * 0.4,
      blur: 0.5, blurMode: 'center', highlight: 0.3 };
    case 'panel': return { ...base, strength: Math.min(24, half * 0.35), blur: 3,
      blurMode: 'center', highlight: 0.25 };
    default: throw new TypeError('Unknown glass preset');
  }
}
