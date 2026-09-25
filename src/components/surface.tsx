import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import type { LensShape } from '../optics.js';
import { assignRef, classes, materialStyle, GlassContext, useComponentLens, useTheme, type MaterialProps } from './context.js';
import { lensFor } from '../optics.js';

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement>, MaterialProps {
  shape?: LensShape;
  radius?: number;
  /** Keep top-layer surfaces (for example popovers) independent of a media scene. */
  local?: boolean;
}
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { children, refractionTarget, optics, variant, appearance, tintLevel, shape = 'rounded-rect', radius = 28, local = false, className, style, ...props }, ref) {
  const root = useRef<HTMLDivElement | null>(null), source = useRef<HTMLDivElement | null>(null);
  const theme = useTheme({ variant, appearance, tintLevel }), id = useId();
  const renderer = useComponentLens(root, source, { id, ...theme, shape, radius, local, optics, enabled: refractionTarget != null });
  return <div {...props} ref={node => { root.current = node; assignRef(ref, node); }}
    className={classes('prism-material', 'prism-surface', className)} data-variant={theme.variant} data-appearance={theme.appearance}
    data-prism-renderer={renderer} data-shape={shape} style={{ ...materialStyle(theme), borderRadius: shape === 'circle' || shape === 'ellipse' ? '50%' : shape === 'capsule' ? 999 : radius, ...style }}>
    {refractionTarget != null && renderer === 'svg-source' ? <div className="prism-source-mask"><div className="prism-source" ref={node => { source.current = node; if (node) node.inert = true; }} aria-hidden="true"><div className="prism-artwork">{refractionTarget}</div></div></div> : null}
    <span className="prism-lens" aria-hidden="true" />
    <div className="prism-content"><GlassContext.Provider value={{ ...theme, nested: true }}>{children}</GlassContext.Provider></div>
  </div>;
});

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, MaterialProps {
  shape?: 'capsule' | 'rounded-rect' | 'circle';
}
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { children, refractionTarget, optics, variant, appearance, tintLevel, shape = 'capsule', className, style, type = 'button', ...props }, ref) {
  const root = useRef<HTMLButtonElement | null>(null), source = useRef<HTMLSpanElement | null>(null);
  const theme = useTheme({ variant, appearance, tintLevel }), id = useId();
  const renderer = useComponentLens(root, source, { id, ...theme, shape, radius: 12, optics, enabled: refractionTarget != null, pressScale: -0.025,
    geometry: (width, height) => {
      const configured = getComputedStyle(root.current!).getPropertyValue('--prism-control-height').trim();
      const h = Math.min(height, configured.endsWith('%') ? height * parseFloat(configured) / 100 : parseFloat(configured) || height);
      const w = shape === 'circle' ? h : width;
      return lensFor(shape, { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h, radius: 12 });
    } });
  return <button {...props} type={type} ref={node => { root.current = node; assignRef(ref, node); }}
    className={classes('prism-material', 'prism-button', className)} data-shape={shape} data-prism-control
    data-variant={theme.variant} data-appearance={theme.appearance} data-prism-renderer={renderer} style={{ ...materialStyle(theme), ...style }}>
    {refractionTarget != null && renderer === 'svg-source' ? <span className="prism-source-mask"><span className="prism-source" ref={node => { source.current = node; if (node) node.inert = true; }} aria-hidden="true"><span className="prism-artwork">{refractionTarget}</span></span></span> : null}
    <span className="prism-lens" aria-hidden="true" /><span className="prism-content">{children}</span>
  </button>;
});

export const GlassToolbar = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassToolbar({ className, onKeyDown, ...props }, ref) {
  return <GlassSurface shape="capsule" {...props} ref={ref} role="toolbar" className={classes('prism-toolbar', className)} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !(event.target instanceof HTMLButtonElement)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const index = buttons.indexOf(event.target); if (index < 0) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next]?.focus();
  }} />;
});
