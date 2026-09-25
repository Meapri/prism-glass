import { clamp, finite, normalizeLens } from './optics.js';
import { buildAssets, createFilter, type MapAssets } from './svg.js';
import type { GlassController, GlassOptions, GlassPatch, GlassDiagnostics } from './types.js';
export type { GlassController, GlassOptions, GlassPatch, GlassDiagnostics } from './types.js';
export { lensFor } from './optics.js';
export { getGlassPreset, type GlassPreset } from './presets.js';
export type { Lens, LensShape, SurfaceProfile, BlurMode } from './optics.js';
export { getGlassMaterial, materialOptics, observeGlassPreferences, type GlassMaterial, type GlassVariant, type GlassAppearance, type GlassPreferences } from './materials.js';
export { bindGlassInteraction, stepSpring, type GlassInteraction, type GlassInteractionController, type SpringState } from './motion.js';
type Normalized = Required<Omit<GlassOptions, 'onStatus'>> & Pick<GlassOptions, 'onStatus'>;
const owners = new WeakSet<HTMLElement>();
const defaults = { strength: 24, ior: 1.5, bevel: 24, blur: 0, saturation: 1, highlight: 0.55,
  surface: 'rim' as const, depth: 1, curvature: 4, blurMode: 'uniform' as const,
  resolution: 256, maxSourcePixels: 4_000_000, enabled: true, live: false,
  respectReducedTransparency: true, refreshFilterId: 'auto' as const };
function normalize(options: GlassOptions): Normalized {
  const o = { ...defaults, ...options, lens: normalizeLens(options.lens) };
  const ranges = { strength: [0, 64], ior: [1, 3], bevel: [1, 512], blur: [0, 24], saturation: [0, 3], depth: [0, 4], curvature: [2, 8], highlight: [0, 1], resolution: [32, 512], maxSourcePixels: [10_000, 64_000_000] } as const;
  for (const key of Object.keys(ranges) as (keyof typeof ranges)[]) {
    const [min, max] = ranges[key]; o[key] = clamp(finite(o[key], key), min, max);
  }
  o.resolution = Math.round(o.resolution);
  for (const name of ['enabled', 'live', 'respectReducedTransparency'] as const) {
    if (typeof o[name] !== 'boolean') throw new TypeError(`${name} must be boolean`);
  }
  if (!['auto', 'always', 'never'].includes(o.refreshFilterId)) throw new TypeError('Invalid refreshFilterId');
  if (!['rim', 'dome', 'concave'].includes(o.surface)) throw new TypeError('Invalid surface');
  if (!['uniform', 'center', 'edge'].includes(o.blurMode)) throw new TypeError('Invalid blurMode');
  return o;
}

/** Apply a lens to the element's own painted pixels, never an implicit backdrop. */
export function createGlass(source: HTMLElement, options: GlassOptions): GlassController {
  const doc = source.ownerDocument, win = doc.defaultView;
  if (!win || !doc.body || !source.isConnected) throw new Error('Mount the source in a document before creating glass');
  if (owners.has(source)) throw new Error('This source already has a glass controller');
  if (win.getComputedStyle(source).filter !== 'none') throw new Error('Use a dedicated source wrapper without an existing CSS filter');
  let config = normalize(options);
  const initialFilter = source.style.getPropertyValue('filter');
  const initialPriority = source.style.getPropertyPriority('filter');
  const id = `prism-${Math.random().toString(36).slice(2)}`;
  // Repaint when decoded resources enter the SVG graph, including WebKit ID refresh.
  const graph = createFilter(doc, id, schedule);
  owners.add(source);
  const webkit = /AppleWebKit/i.test(win.navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/i.test(win.navigator.userAgent);
  const transparency = win.matchMedia('(prefers-reduced-transparency: reduce)');
  let dead = false, visible = true, frame = 0, revision = 0, generation = 0;
  let key = '', pendingKey = '', ownedFilter = '', assets: MapAssets | undefined;
  let lastWidth = 0, lastHeight = 0;
  let diagnostic: GlassDiagnostics = { state: 'loading', reason: 'initializing', renderer: 'svg-source',
    mapBuilds: 0, renders: 0, mapGenerationMs: 0, sourcePixels: 0, mapSize: [0, 0], visualSupportVerified: false };
  const snapshot = () => ({ ...diagnostic, mapSize: [...diagnostic.mapSize] as [number, number] });
  function status(state: GlassDiagnostics['state'], reason: string) {
    const changed = state !== diagnostic.state || reason !== diagnostic.reason;
    diagnostic.state = state; diagnostic.reason = reason;
    if (changed) config.onStatus?.(snapshot());
  }
  function restoreFilter() {
    if (ownedFilter && source.style.getPropertyValue('filter') === ownedFilter) {
      if (initialFilter) source.style.setProperty('filter', initialFilter, initialPriority);
      else source.style.removeProperty('filter');
    }
    ownedFilter = '';
  }
  function schedule() { if (!dead && !frame) frame = win!.requestAnimationFrame(render); }
  function write() {
    graph.layout(config.lens, lastWidth, lastHeight, config.strength, config.blur, config.highlight, config.blurMode, config.saturation);
    if (config.refreshFilterId === 'always' || (config.refreshFilterId === 'auto' && webkit)) {
      graph.filter.id = `${id}-${++revision}`;
    }
    ownedFilter = `url("#${graph.filter.id}")`;
    source.style.setProperty('filter', ownedFilter);
    ownedFilter = source.style.getPropertyValue('filter');
    diagnostic.renders++;
    status('ready', 'svg-source-selected');
  }
  function render() {
    frame = 0;
    if (dead) return;
    if (!config.enabled || (config.respectReducedTransparency && transparency.matches)) {
      restoreFilter(); status('disabled', config.enabled ? 'reduced-transparency' : 'effect-disabled'); return;
    }
    if (!source.isConnected || !visible || doc.hidden) { restoreFilter(); status('paused', 'not-visible'); return; }
    // Layout dimensions, not transformed client bounds. Keep the source untransformed.
    lastWidth = source.offsetWidth; lastHeight = source.offsetHeight;
    diagnostic.sourcePixels = Math.round(lastWidth * lastHeight * win!.devicePixelRatio ** 2);
    if (!lastWidth || !lastHeight) { restoreFilter(); status('paused', 'empty-source'); return; }
    if (diagnostic.sourcePixels > config.maxSourcePixels) { restoreFilter(); status('limited', 'source-pixel-budget'); return; }
    const { width, height, radius, shape } = config.lens;
    const nextKey = [width, height, radius, shape, config.bevel, config.ior, config.resolution, config.surface, config.depth, config.curvature, config.blurMode].join(':');
    if (key === nextKey && pendingKey && pendingKey !== nextKey) { generation++; pendingKey = ''; }
    if (key !== nextKey) {
      if (pendingKey !== nextKey) {
        pendingKey = nextKey; const ticket = ++generation;
        const start = win!.performance.now();
        status('loading', 'building-map');
        void buildAssets(doc, { width, height, radius, shape, bevel: config.bevel, ior: config.ior,
          surface: config.surface, depth: config.depth, curvature: config.curvature, blurMode: config.blurMode }, config.resolution).then(next => {
          if (dead || ticket !== generation) { next.dispose(); return; }
          const previous = assets; assets = next; graph.maps(next);
          key = nextKey; pendingKey = ''; diagnostic.mapBuilds++;
          diagnostic.mapGenerationMs = win!.performance.now() - start;
          diagnostic.mapSize = [next.width, next.height];
          previous?.dispose(); schedule();
        }).catch(error => {
          if (dead || ticket !== generation) return;
          pendingKey = ''; restoreFilter(); status('error', error instanceof Error ? error.message : 'map-generation-failed');
        });
      }
      return;
    }
    write();
    if (config.live) schedule();
  }
  const resize = new win.ResizeObserver(schedule); resize.observe(source);
  const intersection = 'IntersectionObserver' in win ? new win.IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true; schedule();
  }) : undefined;
  intersection?.observe(source);
  transparency.addEventListener('change', schedule);
  doc.addEventListener('visibilitychange', schedule);
  win.addEventListener('resize', schedule);
  schedule();
  return {
    update(patch: GlassPatch) {
      if (dead) throw new Error('Cannot update a destroyed glass controller');
      // Validate atomically before mutating live state.
      config = normalize({ ...config, ...patch, lens: { ...config.lens, ...patch.lens } });
      schedule();
    },
    refresh() { if (!dead) schedule(); },
    getDiagnostics: snapshot,
    destroy() {
      if (dead) return;
      dead = true; generation++; if (frame) win.cancelAnimationFrame(frame);
      resize.disconnect(); intersection?.disconnect();
      transparency.removeEventListener('change', schedule);
      doc.removeEventListener('visibilitychange', schedule); win.removeEventListener('resize', schedule);
      restoreFilter(); graph.destroy(); assets?.dispose(); owners.delete(source);
      status('destroyed', 'disposed');
    },
  };
}
