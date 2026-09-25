import { clamp, finite, generateMaps, normalizeLens } from './optics.js';
import { getGlassMaterial, observeGlassPreferences, type GlassPreferences } from './materials.js';
import { vertexShader, fragmentShader } from './media-shaders.js';
import type { GlassMediaSource, MediaGlassOptions, MediaGlassDiagnostics, MediaGlassController, MediaLens } from './media-types.js';
export type * from './media-types.js';

const owners = new WeakSet<HTMLCanvasElement>();
type NormalLens = ReturnType<typeof normalizeMediaLens>;
function normalizeMediaLens(input: MediaLens) {
  if (!input.id || typeof input.id !== 'string') throw new TypeError('Every media lens needs an id');
  const lens = normalizeLens(input.lens);
  const material = getGlassMaterial(input.variant, input.appearance);
  const options = { ...input, lens, material, strength: input.strength ?? Math.min(24, Math.min(lens.width, lens.height) * 0.2),
    bevel: input.bevel ?? Math.min(24, Math.min(lens.width, lens.height) * 0.3), ior: input.ior ?? 1.5,
    surface: input.surface ?? 'rim', depth: input.depth ?? 1, curvature: input.curvature ?? 4,
    blurMode: input.blurMode ?? 'uniform', blur: input.blur ?? material.blur,
    highlight: input.highlight ?? material.highlight, chroma: input.chroma ?? material.chroma,
    dimming: input.dimming ?? material.dimming, press: input.press ?? 0, hover: input.hover ?? 0,
    pointer: input.pointer ?? [0.5, 0.5] as const };
  const ranges = { strength: [0, 64], bevel: [1, 512], ior: [1, 3], depth: [0, 4], curvature: [2, 8],
    blur: [0, 16], highlight: [0, 1], chroma: [0, 3], dimming: [0, 1], press: [0, 1], hover: [0, 1] } as const;
  for (const key of Object.keys(ranges) as (keyof typeof ranges)[]) {
    const [min, max] = ranges[key]; options[key] = clamp(finite(options[key], key), min, max);
  }
  if (!['rim', 'dome', 'concave'].includes(options.surface) || !['uniform', 'center', 'edge'].includes(options.blurMode)) throw new TypeError('Invalid optical material');
  if (options.pointer.length !== 2) throw new TypeError('pointer needs two coordinates');
  options.pointer = options.pointer.map(value => clamp(finite(value, 'pointer'), 0, 1)) as [number, number];
  return options;
}
function normalizeLenses(inputs: readonly MediaLens[]) {
  if (inputs.length > 64) throw new RangeError('A media scene supports at most 64 lenses');
  const lenses = inputs.map(normalizeMediaLens);
  if (new Set(lenses.map(lens => lens.id)).size !== lenses.length) throw new Error('Media lens ids must be unique');
  return lenses;
}
function normalizeOptions(input: Omit<MediaGlassOptions, 'lenses'>, dpr: number) {
  const options = { fit: 'cover' as const, position: [0.5, 0.5] as readonly [number, number], resolution: 256,
    backgroundColor: [0, 0, 0] as readonly [number, number, number],
    pixelRatio: Math.min(dpr, 2), maxPixels: 4_000_000, enabled: true, live: false, respectPreferences: true, ...input };
  if (!['cover', 'contain', 'fill'].includes(options.fit)) throw new TypeError('Invalid media fit');
  for (const key of ['enabled', 'live', 'respectPreferences'] as const) if (typeof options[key] !== 'boolean') throw new TypeError(`${key} must be boolean`);
  options.resolution = Math.round(clamp(finite(options.resolution, 'resolution'), 32, 512));
  options.pixelRatio = clamp(finite(options.pixelRatio, 'pixelRatio'), 0.5, 3);
  options.maxPixels = clamp(finite(options.maxPixels, 'maxPixels'), 10_000, 16_000_000);
  if (options.position.length !== 2) throw new TypeError('position needs two coordinates');
  options.position = options.position.map(value => clamp(finite(value, 'position'), 0, 1)) as [number, number];
  if (options.backgroundColor.length !== 3) throw new TypeError('backgroundColor needs three channels');
  options.backgroundColor = options.backgroundColor.map(value => clamp(finite(value, 'backgroundColor'), 0, 1)) as [number, number, number];
  return options;
}

/** Shared refraction for video/image/canvas pixels. Supply a separate transparent overlay canvas. */
export function createMediaGlass(canvas: HTMLCanvasElement, source: GlassMediaSource, options: MediaGlassOptions = {}): MediaGlassController {
  const doc = canvas.ownerDocument, win = doc.defaultView;
  if (!win || !canvas.isConnected) throw new Error('Mount the overlay canvas before creating media glass');
  if (source === canvas) throw new Error('The source and overlay canvases must be different');
  if (!['VIDEO', 'IMG', 'CANVAS'].includes(source.tagName)) throw new TypeError('Media source must be a video, image, or canvas');
  if (owners.has(canvas)) throw new Error('This canvas already has a media glass controller');
  const { lenses: initialLenses = [], ...settings } = options;
  const copyInputs = (inputs: readonly MediaLens[]) => inputs.map(item => ({ ...item, lens: { ...item.lens }, pointer: item.pointer ? [...item.pointer] as [number, number] : undefined }));
  let config = normalizeOptions(settings, win.devicePixelRatio), lenses = normalizeLenses(initialLenses);
  let inputs = copyInputs(initialLenses);
  const video = source.tagName === 'VIDEO' ? source as HTMLVideoElement : undefined;
  const image = source.tagName === 'IMG' ? source as HTMLImageElement : undefined;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
  const initial = { width: canvas.width, height: canvas.height, state: canvas.getAttribute('data-prism-state') };
  let dead = false, lost = false, failed = false, visible = true, dirty = true, frame = 0, videoFrame = 0;
  let program: WebGLProgram | undefined, buffer: WebGLBuffer | undefined, mediaTexture: WebGLTexture | undefined;
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const maps = new Map<string, { map: WebGLTexture; finish: WebGLTexture }>();
  let preferences: GlassPreferences = { reducedMotion: false, reducedTransparency: false, increasedContrast: false, forcedColors: false, dark: false };
  const diagnostic: MediaGlassDiagnostics = { state: 'loading', reason: 'initializing', renderer: 'webgl-media',
    lenses: lenses.length, mapBuilds: 0, textureUploads: 0, renders: 0, pixels: 0, visualSupportVerified: false };
  const snapshot = () => ({ ...diagnostic });
  function status(state: MediaGlassDiagnostics['state'], reason: string) {
    const changed = state !== diagnostic.state || reason !== diagnostic.reason;
    diagnostic.state = state; diagnostic.reason = reason; canvas.dataset.prismState = state;
    if (changed) config.onStatus?.(snapshot());
  }
  function texture() {
    const item = gl!.createTexture(); if (!item) throw new Error('WebGL texture allocation failed');
    gl!.bindTexture(gl!.TEXTURE_2D, item);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return item;
  }
  function init() {
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    try {
      const nextProgram = gl.createProgram(); if (!nextProgram) throw new Error('WebGL program allocation failed');
      program = nextProgram;
      for (const [type, code] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]] as const) {
        const shader = gl.createShader(type); if (!shader) throw new Error('WebGL shader allocation failed');
        shaders.push(shader);
        const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision;
        gl.shaderSource(shader, !precision && type === gl.FRAGMENT_SHADER ? code.replace('highp', 'mediump') : code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`Glass shader compilation failed: ${gl.getShaderInfoLog(shader)}`);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Glass shader link failed: ${gl.getProgramInfoLog(program)}`);
      buffer = gl.createBuffer() ?? undefined; if (!buffer) throw new Error('WebGL buffer allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
      mediaTexture = texture();
      for (const name of ['view', 'rect', 'radius', 'ellipse', 'surfaceSign', 'pixelRatio', 'sourceRect', 'backgroundColor', 'source', 'map', 'finish', 'tint', 'strength', 'blur', 'chroma', 'dimming', 'highlight', 'press', 'hover', 'pointer']) {
        uniforms.set(name, gl.getUniformLocation(program, `u_${name}`));
      }
      dirty = true;
    } catch (error) { disposeResources(); throw error; }
    finally { for (const shader of shaders) gl.deleteShader(shader); }
  }
  const uniform = (name: string) => uniforms.get(name) ?? null;
  function releaseMaps() {
    for (const entry of maps.values()) { gl?.deleteTexture(entry.map); gl?.deleteTexture(entry.finish); }
    maps.clear();
  }
  function disposeResources() {
    if (!gl) return;
    releaseMaps();
    if (mediaTexture) gl.deleteTexture(mediaTexture); if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program);
    mediaTexture = undefined; buffer = undefined; program = undefined; uniforms.clear();
  }
  function mapKey(item: NormalLens) {
    const l = item.lens;
    return [l.width, l.height, l.radius, l.shape, item.bevel, item.ior, item.surface, item.depth, item.curvature, item.blurMode, config.resolution].join(':');
  }
  function opticalMap(item: NormalLens, key: string) {
    const cached = maps.get(key); if (cached) return cached;
    const pixels = generateMaps({ ...item, ...item.lens }, config.resolution);
    const finishPixels = new Uint8Array(pixels.displacement.length);
    for (let i = 0; i < finishPixels.length; i += 4) {
      finishPixels[i] = pixels.mask[i + 3]; finishPixels[i + 1] = pixels.highlight[i + 3];
      finishPixels[i + 2] = pixels.frost?.[i + 3] ?? 255; finishPixels[i + 3] = 255;
    }
    let map: WebGLTexture | undefined, finish: WebGLTexture | undefined;
    try {
      map = texture();
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, pixels.width, pixels.height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, pixels.displacement);
      finish = texture();
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, pixels.width, pixels.height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, finishPixels);
      const entry = { map, finish }; maps.set(key, entry); diagnostic.mapBuilds++; return entry;
    } catch (error) { if (map) gl!.deleteTexture(map); if (finish) gl!.deleteTexture(finish); throw error; }
  }
  function cancelVideo() { if (videoFrame && video) video.cancelVideoFrameCallback(videoFrame); videoFrame = 0; }
  function schedule() { if (!dead && !frame) frame = win!.requestAnimationFrame(render); }
  function refresh() { if (!dead) { dirty = true; failed = false; schedule(); } }
  function trackFrames() {
    if (dead || lost || failed || !visible || doc.hidden || !config.enabled || diagnostic.state !== 'ready' || !lenses.length) return;
    if (video && !video.paused && !video.ended) {
      if ('requestVideoFrameCallback' in video) {
        if (!videoFrame) videoFrame = video.requestVideoFrameCallback(() => { videoFrame = 0; dirty = true; schedule(); });
      } else { dirty = true; schedule(); }
    } else if (!video && config.live) { dirty = true; schedule(); }
  }
  function clear() { if (gl && !lost) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } }
  function render() {
    frame = 0; if (dead) return;
    if (!gl) { status('fallback', 'webgl-unavailable'); return; }
    if (lost) { status('fallback', 'webgl-context-lost'); return; }
    if (failed) return;
    const accessible = config.respectPreferences && (preferences.reducedTransparency || preferences.increasedContrast || preferences.forcedColors);
    if (!config.enabled || accessible) { cancelVideo(); clear(); status('disabled', accessible ? 'accessibility-preference' : 'effect-disabled'); return; }
    if (!canvas.isConnected || !visible || doc.hidden) { cancelVideo(); status('paused', 'not-visible'); return; }
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) { cancelVideo(); status('paused', 'empty-canvas'); return; }
    const sourceWidth = video ? video.videoWidth : image ? image.naturalWidth : (source as HTMLCanvasElement).width;
    const sourceHeight = video ? video.videoHeight : image ? image.naturalHeight : (source as HTMLCanvasElement).height;
    if (!sourceWidth || !sourceHeight || (video && video.readyState < 2) || (image && !image.complete)) { clear(); status('loading', 'waiting-for-media'); return; }
    try {
      if (!program) init();
      const ratio = Math.min(config.pixelRatio, Math.sqrt(config.maxPixels / (width * height)));
      const w = Math.max(1, Math.floor(width * ratio)), h = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      diagnostic.pixels = w * h;
      gl.viewport(0, 0, w, h); clear();
      if (!lenses.length) { cancelVideo(); status('ready', 'no-lenses'); return; }
      gl.useProgram(program!); gl.bindBuffer(gl.ARRAY_BUFFER, buffer!);
      const attribute = gl.getAttribLocation(program!, 'a_position');
      gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mediaTexture!);
      if (dirty) {
        const maximum = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
        if (sourceWidth > maximum || sourceHeight > maximum) throw new Error('media-texture-too-large');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('media-texture-upload-failed');
        diagnostic.textureUploads++; dirty = false;
      }
      gl.uniform1i(uniform('source'), 0); gl.uniform1i(uniform('map'), 1); gl.uniform1i(uniform('finish'), 2);
      gl.uniform2f(uniform('view'), width, height);
      gl.uniform1f(uniform('pixelRatio'), ratio);
      gl.uniform3f(uniform('backgroundColor'), ...config.backgroundColor);
      const fit = config.fit === 'cover' ? Math.max(width / sourceWidth, height / sourceHeight) : Math.min(width / sourceWidth, height / sourceHeight);
      const displayWidth = config.fit === 'fill' ? width : sourceWidth * fit, displayHeight = config.fit === 'fill' ? height : sourceHeight * fit;
      gl.uniform4f(uniform('sourceRect'), (width - displayWidth) * config.position[0], (height - displayHeight) * config.position[1], displayWidth, displayHeight);
      const active = new Set<string>();
      for (const item of lenses) {
        const key = mapKey(item); active.add(key);
        // Creating map textures can change the active texture binding. Rebind all
        // three units before each draw, including the one shared media texture.
        const entry = opticalMap(item, key);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mediaTexture!);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, entry.map);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, entry.finish);
        const l = item.lens, material = item.material;
        gl.uniform4f(uniform('rect'), l.x, l.y, l.width, l.height);
        gl.uniform1f(uniform('radius'), l.radius);
        gl.uniform1f(uniform('ellipse'), l.shape === 'circle' || l.shape === 'ellipse' ? 1 : 0);
        gl.uniform1f(uniform('surfaceSign'), item.surface === 'concave' ? -1 : 1);
        gl.uniform4f(uniform('tint'), ...material.tint);
        for (const name of ['strength', 'blur', 'chroma', 'dimming', 'highlight', 'hover'] as const) gl.uniform1f(uniform(name), item[name]);
        gl.uniform1f(uniform('press'), config.respectPreferences && preferences.reducedMotion ? 0 : item.press);
        gl.uniform2f(uniform('pointer'), ...item.pointer);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      for (const [key, entry] of maps) if (!active.has(key)) { gl.deleteTexture(entry.map); gl.deleteTexture(entry.finish); maps.delete(key); }
      diagnostic.renders++; status('ready', ratio < config.pixelRatio ? 'pixel-budget-downsampled' : 'webgl-media-selected'); trackFrames();
    } catch (error) {
      failed = true; cancelVideo(); clear();
      status('error', error instanceof Error ? error.message : 'media-render-failed');
    }
  }
  const onLost = (event: Event) => { event.preventDefault(); lost = true; cancelVideo(); status('fallback', 'webgl-context-lost'); };
  const onRestored = () => {
    // Restoring a context invalidates old GPU handles; do not delete them in the new context.
    lost = false; maps.clear(); mediaTexture = undefined; buffer = undefined; program = undefined; uniforms.clear(); refresh();
  };
  canvas.addEventListener('webglcontextlost', onLost); canvas.addEventListener('webglcontextrestored', onRestored);
  // Canvas layout changes affect sampling coordinates, not the source texture.
  const resize = new win.ResizeObserver(schedule); resize.observe(canvas);
  const intersection = new win.IntersectionObserver(entries => {
    const next = entries[0]?.isIntersecting ?? true;
    if (next && !visible) dirty = true;
    visible = next; schedule();
  });
  intersection.observe(canvas);
  const visibility = () => { if (!doc.hidden) dirty = true; schedule(); };
  doc.addEventListener('visibilitychange', visibility);
  const events = ['loadeddata', 'load', 'seeked', 'play', 'pause', 'ended', 'resize', 'emptied'] as const;
  for (const event of events) source.addEventListener(event, refresh);
  const onError = () => { failed = true; cancelVideo(); clear(); status('error', 'media-load-failed'); };
  source.addEventListener('error', onError);
  const unsubscribe = observeGlassPreferences(win, next => { preferences = next; schedule(); });
  owners.add(canvas); schedule();
  return {
    setLenses(next) {
      if (dead) throw new Error('Cannot update a destroyed media controller');
      const normalized = normalizeLenses(next); inputs = copyInputs(next); lenses = normalized; diagnostic.lenses = lenses.length;
      if (!lenses.length) releaseMaps();
      schedule();
    },
    updateLens(id, patch) {
      if (dead) throw new Error('Cannot update a destroyed media controller');
      const index = lenses.findIndex(item => item.id === id); if (index < 0) throw new Error(`Unknown media lens: ${id}`);
      const old = inputs[index], next = { ...old, ...patch, id, lens: { ...old.lens, ...patch.lens } };
      const normalized = normalizeMediaLens(next); inputs[index] = copyInputs([next])[0]; lenses[index] = normalized; schedule();
    },
    update(patch) { if (dead) throw new Error('Cannot update a destroyed media controller'); config = normalizeOptions({ ...config, ...patch }, win.devicePixelRatio); schedule(); },
    refresh, getDiagnostics: snapshot,
    destroy() {
      if (dead) return; dead = true; if (frame) win.cancelAnimationFrame(frame); cancelVideo();
      resize.disconnect(); intersection.disconnect(); unsubscribe(); doc.removeEventListener('visibilitychange', visibility);
      for (const event of events) source.removeEventListener(event, refresh); source.removeEventListener('error', onError);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      clear(); disposeResources(); owners.delete(canvas); canvas.width = initial.width; canvas.height = initial.height;
      status('destroyed', 'disposed');
      if (initial.state === null) canvas.removeAttribute('data-prism-state'); else canvas.setAttribute('data-prism-state', initial.state);
    },
  };
}
