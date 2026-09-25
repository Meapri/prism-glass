import { useEffect, useMemo, useRef, type HTMLAttributes, type RefObject } from 'react';
import { createMediaGlass } from '../media.js';
import type { GlassMediaSource, MediaGlassController, MediaGlassOptions, MediaLens } from '../media-types.js';
import { classes, GlassContext, MediaContext, useTheme, type MaterialProps } from './context.js';

export interface GlassMediaSceneProps extends HTMLAttributes<HTMLDivElement>, Pick<MaterialProps, 'variant' | 'appearance' | 'tintLevel'> {
  source: RefObject<GlassMediaSource | null>;
  /** Increment after repainting a static canvas source. */
  sourceVersion?: string | number;
  media?: Omit<MediaGlassOptions, 'lenses'>;
}
/** Place the source media and ordinary GlassButton/GlassSurface children in one scene. */
export function GlassMediaScene({ source, sourceVersion, media, variant = 'clear', appearance, tintLevel, children, className, style, ...props }: GlassMediaSceneProps) {
  const root = useRef<HTMLDivElement | null>(null), canvas = useRef<HTMLCanvasElement | null>(null), controller = useRef<MediaGlassController | null>(null);
  const latest = useRef(media); latest.current = media;
  const theme = useTheme({ variant, appearance, tintLevel });
  const readers = useRef(new Map<string, () => MediaLens | null>()), frame = useRef(0);
  const context = useMemo(() => {
    function invalidate() {
      const win = root.current?.ownerDocument.defaultView;
      if (!win || frame.current) return;
      frame.current = win.requestAnimationFrame(() => {
        frame.current = 0;
        const lenses = Array.from(readers.current.values(), read => read()).filter((lens): lens is MediaLens => lens !== null);
        controller.current?.setLenses(lenses);
      });
    }
    return { invalidate, bounds: () => canvas.current?.getBoundingClientRect(), register(id: string, read: () => MediaLens | null) {
      readers.current.set(id, read); invalidate();
      return () => { readers.current.delete(id); invalidate(); };
    } };
  }, []);
  useEffect(() => {
    if (!canvas.current || !source.current) return;
    const node = root.current!, win = node.ownerDocument.defaultView!;
    const instance = createMediaGlass(canvas.current, source.current, { ...latest.current, onStatus: diagnostics => {
      node.dataset.prismState = diagnostics.state; latest.current?.onStatus?.(diagnostics);
    } });
    controller.current = instance; context.invalidate();
    const observer = new win.ResizeObserver(context.invalidate); observer.observe(node);
    win.addEventListener('resize', context.invalidate); win.addEventListener('scroll', context.invalidate, true);
    return () => {
      observer.disconnect(); win.removeEventListener('resize', context.invalidate); win.removeEventListener('scroll', context.invalidate, true);
      if (frame.current) win.cancelAnimationFrame(frame.current); frame.current = 0;
      instance.destroy(); controller.current = null;
    };
  }, [source, context]);
  useEffect(() => { controller.current?.refresh(); }, [sourceVersion]);
  useEffect(() => { if (media) controller.current?.update({ ...media, onStatus: diagnostics => {
    if (root.current) root.current.dataset.prismState = diagnostics.state; latest.current?.onStatus?.(diagnostics);
  } }); }, [media]);
  const position = media?.position ?? [0.5, 0.5], background = media?.backgroundColor ?? [0, 0, 0];
  return <div {...props} ref={root} className={classes('prism-media-scene', className)} style={{
    '--prism-media-fit': media?.fit ?? 'cover',
    '--prism-media-position': position.map(value => `${Math.max(0, Math.min(1, value)) * 100}%`).join(' '),
    backgroundColor: `rgb(${background.map(value => Math.round(Math.max(0, Math.min(1, value)) * 255)).join(' ')})`, ...style } as React.CSSProperties}
    data-variant={theme.variant} data-appearance={theme.appearance}>
    <GlassContext.Provider value={{ ...theme, nested: false }}><MediaContext.Provider value={context}>
      <canvas ref={canvas} className="prism-media-canvas" aria-hidden="true" />{children}
    </MediaContext.Provider></GlassContext.Provider>
  </div>;
}
