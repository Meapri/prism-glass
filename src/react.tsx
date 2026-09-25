import { createElement, forwardRef, useEffect, useRef, type HTMLAttributes, type RefObject } from 'react';
import { createGlass, type GlassController, type GlassOptions } from './index.js';
export * from './components/index.js';

/** The core is created after mount and cleaned up on every unmount (including StrictMode). */
export function useGlass(source: RefObject<HTMLElement | null>, options: GlassOptions) {
  const controller = useRef<GlassController | null>(null);
  const latest = useRef(options); latest.current = options;
  useEffect(() => {
    if (!source.current) return;
    const instance = createGlass(source.current, latest.current);
    controller.current = instance;
    return () => { instance.destroy(); controller.current = null; };
  }, [source]);
  useEffect(() => { controller.current?.update(options); }, [options]);
  return controller;
}

export type GlassSourceProps = HTMLAttributes<HTMLDivElement> & { glass: GlassOptions };
/** Children are the optical source. Place crisp labels/controls in a separate layer. */
export const GlassSource = forwardRef<HTMLDivElement, GlassSourceProps>(function GlassSource({ glass, ...props }, ref) {
  const local = useRef<HTMLDivElement | null>(null);
  useGlass(local, glass);
  return createElement('div', { ...props, ref: (node: HTMLDivElement | null) => {
    local.current = node;
    if (typeof ref === 'function') ref(node); else if (ref) ref.current = node;
  } });
});
