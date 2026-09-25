/** Pure geometry. No DOM access; safe to import during server rendering. */
export type LensShape = 'rounded-rect' | 'circle' | 'capsule' | 'ellipse';
export type SurfaceProfile = 'rim' | 'dome' | 'concave';
export type BlurMode = 'uniform' | 'center' | 'edge';
export interface Lens { x: number; y: number; width: number; height: number; radius: number; shape?: LensShape }
export interface OpticalShape {
  width: number; height: number; radius: number; bevel: number; ior: number;
  shape?: LensShape; surface?: SurfaceProfile; depth?: number; curvature?: number; blurMode?: BlurMode;
}
export interface PixelMaps {
  width: number; height: number;
  displacement: Uint8ClampedArray; mask: Uint8ClampedArray; highlight: Uint8ClampedArray;
  frost?: Uint8ClampedArray;
}

export function finite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
export const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));
export function normalizeLens(lens: Lens): Lens {
  for (const key of ['x', 'y', 'width', 'height', 'radius'] as const) finite(lens[key], `lens.${key}`);
  if (!(lens.width > 0 && lens.height > 0) || lens.width > 8192 || lens.height > 8192) {
    throw new RangeError('Lens dimensions must be in (0, 8192] CSS pixels');
  }
  const shape = lens.shape ?? 'rounded-rect';
  if (!['rounded-rect', 'circle', 'capsule', 'ellipse'].includes(shape)) throw new TypeError('Invalid lens shape');
  if (shape === 'circle' && lens.width !== lens.height) throw new RangeError('A circle needs equal width and height; use lensFor to fit bounds');
  return { ...lens, shape, radius: shape === 'rounded-rect'
    ? clamp(lens.radius, 0, Math.min(lens.width, lens.height) / 2) : Math.min(lens.width, lens.height) / 2 };
}

/** Fit a named shape inside bounds. Circles are centered in the shorter dimension. */
export function lensFor(shape: LensShape, bounds: Omit<Lens, 'shape' | 'radius'> & { radius?: number }): Lens {
  const { width, height } = bounds;
  const radius = bounds.radius ?? Math.min(24, width / 4, height / 4);
  normalizeLens({ ...bounds, radius, shape: shape === 'circle' ? 'rounded-rect' : shape });
  if (shape !== 'circle') return normalizeLens({ ...bounds, radius, shape });
  const size = Math.min(width, height);
  return normalizeLens({ ...bounds, shape, radius: size / 2, width: size, height: size,
    x: bounds.x + (width - size) / 2, y: bounds.y + (height - size) / 2 });
}
export function roundedDistance(x: number, y: number, shape: OpticalShape): number {
  if (shape.shape === 'circle' || shape.shape === 'ellipse') {
    const rx = shape.width / 2, ry = shape.height / 2;
    const px = x - rx, py = y - ry;
    if (rx === ry) return Math.hypot(px, py) - rx;
    // First-order signed-distance estimate: exact zero on the ellipse boundary.
    const k0 = Math.hypot(px / rx, py / ry);
    const k1 = Math.hypot(px / (rx * rx), py / (ry * ry));
    return k1 === 0 ? -Math.min(rx, ry) : k0 * (k0 - 1) / k1;
  }
  const qx = Math.abs(x - shape.width / 2) - (shape.width / 2 - shape.radius);
  const qy = Math.abs(y - shape.height / 2) - (shape.height / 2 - shape.radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - shape.radius;
}
const smoothstep = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** A single-interface optical approximation, not Apple's material/shader. */
export function sampleDisplacement(x: number, y: number, shape: OpticalShape): {
  dx: number; dy: number; mask: number; shine: number; frost: number;
} {
  const d = roundedDistance(x, y, shape);
  if (d >= 0) return { dx: 0, dy: 0, mask: 0, shine: 0, frost: 0 };
  const surface = shape.surface ?? 'rim';
  const bevel = surface === 'rim' ? shape.bevel : Math.min(shape.width, shape.height) / 2;
  const u = clamp(-d / bevel, 0, 1);
  const e = 0.05;
  let nx = roundedDistance(x + e, y, shape) - roundedDistance(x - e, y, shape);
  let ny = roundedDistance(x, y + e, shape) - roundedDistance(x, y - e, shape);
  const n = Math.hypot(nx, ny);
  if (n > 0) { nx /= n; ny /= n; }
  // Slope of a squircle dome. Bound the grazing-angle singularity.
  const q = 1 - u;
  const power = shape.curvature ?? 4;
  const slope = (shape.depth ?? 1) * Math.min(32, q ** (power - 1) / Math.max(1e-6, (1 - q ** power) ** ((power - 1) / power)));
  const incidence = Math.atan(slope);
  const transmission = Math.asin(Math.sin(incidence) / shape.ior);
  const sign = surface === 'concave' ? -1 : 1;
  const bend = Math.sin(incidence - transmission) * sign;
  const mask = smoothstep(-d / 0.8);
  const light = Math.max(0, sign * (nx * -0.6 + ny * -0.8));
  const returnLight = Math.max(0, sign * (nx * 0.6 + ny * 0.8));
  const interior = smoothstep(-d / shape.bevel);
  const frost = shape.blurMode === 'center' ? interior : shape.blurMode === 'edge' ? 1 - interior : 1;
  return { dx: -nx * bend, dy: -ny * bend, mask,
    shine: mask * Math.exp(-Math.max(0, -d - 0.6) / 2) * (0.85 * light + 0.2 * returnLight), frost };
}

export function generateMaps(input: OpticalShape, resolution = 256): PixelMaps {
  const lens = normalizeLens({ ...input, x: 0, y: 0 });
  finite(input.bevel, 'bevel'); finite(input.ior, 'ior'); finite(resolution, 'resolution');
  if (input.bevel <= 0 || input.ior < 1 || input.ior > 3) throw new RangeError('Invalid optical shape');
  const depth = input.depth ?? 1, curvature = input.curvature ?? 4;
  finite(depth, 'depth'); finite(curvature, 'curvature');
  if (depth < 0 || depth > 4 || curvature < 2 || curvature > 8) throw new RangeError('Invalid surface parameters');
  if (!['rim', 'dome', 'concave'].includes(input.surface ?? 'rim') || !['uniform', 'center', 'edge'].includes(input.blurMode ?? 'uniform')) throw new TypeError('Invalid material profile');
  const shape: OpticalShape = { ...input, shape: lens.shape, radius: lens.radius, depth, curvature,
    bevel: Math.min(input.bevel, input.width / 2, input.height / 2) };
  const max = clamp(Math.round(resolution), 32, 512);
  const scale = Math.min(1, max / Math.max(shape.width, shape.height));
  const width = Math.max(2, Math.round(shape.width * scale));
  const height = Math.max(2, Math.round(shape.height * scale));
  const length = width * height * 4;
  const displacement = new Uint8ClampedArray(length);
  const mask = new Uint8ClampedArray(length);
  const highlight = new Uint8ClampedArray(length);
  const frost = input.blurMode && input.blurMode !== 'uniform' ? new Uint8ClampedArray(length) : undefined;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const s = sampleDisplacement((x + 0.5) * shape.width / width, (y + 0.5) * shape.height / height, shape);
    const i = (y * width + x) * 4;
    displacement.set([128 + 127 * s.dx, 128 + 127 * s.dy, 128, 255], i);
    mask.set([255, 255, 255, s.mask * 255], i);
    highlight.set([255, 255, 255, s.shine * 255], i);
    frost?.set([255, 255, 255, s.frost * 255], i);
  }
  return { width, height, displacement, mask, highlight, frost };
}
