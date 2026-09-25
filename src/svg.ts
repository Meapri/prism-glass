import { generateMaps, type OpticalShape, type Lens } from './optics.js';
const NS = 'http://www.w3.org/2000/svg';
export interface MapAssets { urls: string[]; width: number; height: number; dispose(): void }
export async function buildAssets(doc: Document, shape: OpticalShape, resolution: number): Promise<MapAssets> {
  const pixels = generateMaps(shape, resolution);
  const urls: string[] = [];
  const URL = doc.defaultView!.URL;
  try {
    for (const bytes of [pixels.displacement, pixels.mask, pixels.highlight]) {
      const canvas = doc.createElement('canvas');
      canvas.width = pixels.width; canvas.height = pixels.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('A 2D canvas is required to generate the lens map');
      const image = ctx.createImageData(pixels.width, pixels.height);
      image.data.set(bytes); ctx.putImageData(image, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('PNG encoding failed')), 'image/png'));
      const url = URL.createObjectURL(blob); urls.push(url);
      // Decode before assigning feImage href, avoiding a partially loaded graph.
      const img = doc.createElement('img'); img.src = url; await img.decode();
    }
    return { urls, width: pixels.width, height: pixels.height,
      dispose: () => { for (const url of urls.splice(0)) URL.revokeObjectURL(url); } };
  } catch (error) { for (const url of urls) URL.revokeObjectURL(url); throw error; }
}
export function createFilter(doc: Document, id: string) {
  function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}) {
    const node = doc.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  }
  const svg = el('svg', { 'aria-hidden': 'true', focusable: 'false', width: 0, height: 0 });
  svg.dataset.prismDefs = id;
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  const defs = el('defs'); svg.append(defs);
  const filter = el('filter', { id, x: 0, y: 0, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' });
  defs.append(filter);
  const map = el('feImage', { result: 'mapRaw', preserveAspectRatio: 'none' });
  // 128/255 -> exactly 0.5. Both X/Y channels share the same decode.
  const correct = el('feColorMatrix', { in: 'mapRaw', result: 'map', type: 'matrix',
    values: `${255 / 254} 0 0 0 ${-1 / 254} 0 ${255 / 254} 0 0 ${-1 / 254} 0 0 1 0 0 0 0 0 1 0` });
  const mask = el('feImage', { result: 'lensMask', preserveAspectRatio: 'none' });
  const blur = el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0, result: 'softSource' });
  const displacement = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: 48, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent' });
  const inside = el('feComposite', { in: 'bent', in2: 'lensMask', operator: 'in', result: 'inside' });
  const outside = el('feComposite', { in: 'SourceGraphic', in2: 'lensMask', operator: 'out', result: 'outside' });
  const reunite = el('feComposite', { in: 'inside', in2: 'outside', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'reunited' });
  const highlight = el('feImage', { result: 'shine', preserveAspectRatio: 'none' });
  const light = el('feComponentTransfer', { in: 'shine', result: 'light' });
  const alpha = el('feFuncA', { type: 'linear', slope: 0.55 }); light.append(alpha);
  const finish = el('feComposite', { in: 'light', in2: 'reunited', operator: 'over' });
  filter.append(map, correct, mask, blur, displacement, inside, outside, reunite, highlight, light, finish);
  doc.body.append(svg);
  return {
    svg, filter,
    maps(assets: MapAssets) { [map, mask, highlight].forEach((node, i) => node.setAttribute('href', assets.urls[i])); },
    layout(lens: Lens, width: number, height: number, strength: number, softness: number, shine: number) {
      filter.setAttribute('width', String(width)); filter.setAttribute('height', String(height));
      for (const node of [map, mask, highlight, displacement, inside, light]) {
        for (const [key, value] of Object.entries({ x: lens.x, y: lens.y, width: lens.width, height: lens.height })) node.setAttribute(key, String(value));
      }
      displacement.setAttribute('scale', String(strength * 2));
      displacement.setAttribute('in', softness > 0 ? 'softSource' : 'SourceGraphic');
      blur.setAttribute('stdDeviation', String(softness)); alpha.setAttribute('slope', String(shine));
    },
    destroy() { svg.remove(); },
  };
}
