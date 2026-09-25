import { generateMaps, type OpticalShape, type Lens, type BlurMode } from './optics.js';
const NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
export interface MapAssets { urls: string[]; width: number; height: number; dispose(): void }
export async function buildAssets(doc: Document, shape: OpticalShape, resolution: number): Promise<MapAssets> {
  const pixels = generateMaps(shape, resolution);
  const urls: string[] = [];
  try {
    const channels = [pixels.displacement, pixels.mask, pixels.highlight];
    if (pixels.frost) channels.push(pixels.frost);
    for (const bytes of channels) {
      const canvas = doc.createElement('canvas');
      canvas.width = pixels.width; canvas.height = pixels.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('A 2D canvas is required to generate the lens map');
      const image = ctx.createImageData(pixels.width, pixels.height);
      image.data.set(bytes); ctx.putImageData(image, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('PNG encoding failed')), 'image/png'));
      // Keep feImage inputs self-contained across Safari's image loading paths.
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new doc.defaultView!.FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('PNG data URL encoding failed'));
        reader.readAsDataURL(blob);
      });
      urls.push(url);
      // Decode before assigning feImage href, avoiding a partially loaded graph.
      const img = doc.createElement('img'); img.src = url; await img.decode();
    }
    return { urls, width: pixels.width, height: pixels.height,
      dispose: () => { urls.length = 0; } };
  } catch (error) { urls.length = 0; throw error; }
}
export function createFilter(doc: Document, id: string, onImageLoad: () => void) {
  function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}) {
    const node = doc.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    return node;
  }
  const svg = el('svg', { 'aria-hidden': 'true', focusable: 'false', width: 1, height: 1 });
  svg.dataset.prismDefs = id;
  svg.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none';
  const defs = el('defs'); svg.append(defs);
  // Reference CSS filters in WebKit offset userSpaceOnUse by the source's page
  // position. Keep every region in the source's bounding-box coordinate system.
  const filter = el('filter', { id, x: 0, y: 0, width: 1, height: 1,
    filterUnits: 'objectBoundingBox', primitiveUnits: 'objectBoundingBox', 'color-interpolation-filters': 'sRGB' });
  defs.append(filter);
  const map = el('feImage', { result: 'mapRaw', preserveAspectRatio: 'none' });
  const correct = el('feColorMatrix', { in: 'mapRaw', result: 'map', type: 'matrix' });
  const mask = el('feImage', { result: 'lensMask', preserveAspectRatio: 'none' });
  const blur = el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 0, result: 'softSource' });
  const displacement = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: 48, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent' });
  const softDisplacement = el('feDisplacementMap', { in: 'softSource', in2: 'map', scale: 48, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bentSoft' });
  const frost = el('feImage', { result: 'frostMask', preserveAspectRatio: 'none' });
  const frostedPart = el('feComposite', { in: 'bentSoft', in2: 'frostMask', operator: 'in', result: 'frostedPart' });
  const clearPart = el('feComposite', { in: 'bent', in2: 'frostMask', operator: 'out', result: 'clearPart' });
  const mixed = el('feComposite', { in: 'frostedPart', in2: 'clearPart', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'mixed' });
  const inside = el('feComposite', { in: 'bent', in2: 'lensMask', operator: 'in', result: 'inside' });
  const outside = el('feComposite', { in: 'SourceGraphic', in2: 'lensMask', operator: 'out', result: 'outside' });
  const reunite = el('feComposite', { in: 'inside', in2: 'outside', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'reunited' });
  const highlight = el('feImage', { result: 'shine', preserveAspectRatio: 'none' });
  const light = el('feComponentTransfer', { in: 'shine', result: 'light' });
  const alpha = el('feFuncA', { type: 'linear', slope: 0.55 }); light.append(alpha);
  const finish = el('feComposite', { in: 'light', in2: 'reunited', operator: 'over' });
  // Do not leave an unused, unloaded feImage in the graph: WebKit can reject
  // the entire filter even when that image is not part of the output branch.
  filter.append(map, correct, mask, displacement, inside, outside, reunite, highlight, light, finish);
  const images = [map, mask, highlight, frost];
  for (const node of images) node.addEventListener('load', onImageLoad);
  let pipeline = 'clear';
  doc.body.append(svg);
  return {
    svg, filter,
    maps(assets: MapAssets) {
      images.forEach((node, i) => {
        const url = assets.urls[i] ?? assets.urls[1];
        node.setAttribute('href', url);
        node.setAttributeNS(XLINK, 'xlink:href', url);
      });
    },
    layout(lens: Lens, width: number, height: number, strength: number, softness: number, shine: number, mode: BlurMode = 'uniform') {
      const nextPipeline = softness === 0 ? 'clear' : mode;
      if (nextPipeline !== pipeline) {
        pipeline = nextPipeline;
        const nodes: SVGElement[] = [map, correct, mask, displacement];
        if (softness > 0) {
          nodes.push(blur, softDisplacement);
          if (mode !== 'uniform') nodes.push(frost, frostedPart, clearPart, mixed);
        }
        filter.replaceChildren(...nodes, inside, outside, reunite, highlight, light, finish);
      }
      for (const node of [correct, blur, displacement, softDisplacement, frostedPart, clearPart, mixed, inside, outside, reunite, light, finish]) {
        for (const [key, value] of Object.entries({ x: 0, y: 0, width: 1, height: 1 })) node.setAttribute(key, String(value));
      }
      for (const node of images) {
        for (const [key, value] of Object.entries({ x: lens.x / width, y: lens.y / height,
          width: lens.width / width, height: lens.height / height })) node.setAttribute(key, String(value));
      }
      // Bounding-box units scale X/Y by different dimensions. Attenuate each
      // channel so strength stays in CSS pixels on non-square sources, while
      // encoded 128 still decodes to the exact neutral value 0.5.
      const unit = Math.min(width, height), sx = unit / width, sy = unit / height;
      correct.setAttribute('values', `${255 / 254 * sx} 0 0 0 ${0.5 - 128 / 254 * sx} 0 ${255 / 254 * sy} 0 0 ${0.5 - 128 / 254 * sy} 0 0 1 0 0 0 0 0 1 0`);
      displacement.setAttribute('scale', String(strength * 2 / unit));
      softDisplacement.setAttribute('scale', String(strength * 2 / unit));
      inside.setAttribute('in', softness === 0 ? 'bent' : mode === 'uniform' ? 'bentSoft' : 'mixed');
      blur.setAttribute('stdDeviation', `${softness / width} ${softness / height}`); alpha.setAttribute('slope', String(shine));
    },
    destroy() { for (const node of images) node.removeEventListener('load', onImageLoad); svg.remove(); },
  };
}
