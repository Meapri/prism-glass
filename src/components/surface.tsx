import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import type { LensShape } from '../optics.js';
import { assignRef, classes, GlassContext, useComponentLens, useTheme, type MaterialProps } from './context.js';

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement>, MaterialProps {
  shape?: LensShape;
  radius?: number;
  /** Keep top-layer surfaces (for example popovers) independent of a media scene. */
  local?: boolean;
}
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { children, refractionTarget, optics, variant, appearance, shape = 'rounded-rect', radius = 20, local = false, className, style, ...props }, ref) {
  const root = useRef<HTMLDivElement | null>(null), source = useRef<HTMLDivElement | null>(null);
  const theme = useTheme({ variant, appearance }), id = useId();
  const renderer = useComponentLens(root, source, { id, ...theme, shape, radius, local, optics, enabled: refractionTarget != null });
  return <div {...props} ref={node => { root.current = node; assignRef(ref, node); }}
    className={classes('prism-material', 'prism-surface', className)} data-variant={theme.variant} data-appearance={theme.appearance}
    data-prism-renderer={renderer} style={{ borderRadius: shape === 'circle' || shape === 'ellipse' ? '50%' : shape === 'capsule' ? 999 : radius, ...style }}>
    {refractionTarget != null && renderer === 'svg-source' ? <div className="prism-source" ref={node => { source.current = node; if (node) node.inert = true; }} aria-hidden="true"><div className="prism-artwork">{refractionTarget}</div></div> : null}
    <span className="prism-lens" aria-hidden="true" />
    <div className="prism-content"><GlassContext.Provider value={{ ...theme, nested: true }}>{children}</GlassContext.Provider></div>
  </div>;
});

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, MaterialProps {
  shape?: 'capsule' | 'rounded-rect' | 'circle';
}
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { children, refractionTarget, optics, variant, appearance, shape = 'capsule', className, type = 'button', ...props }, ref) {
  const root = useRef<HTMLButtonElement | null>(null), source = useRef<HTMLSpanElement | null>(null);
  const theme = useTheme({ variant, appearance }), id = useId();
  const renderer = useComponentLens(root, source, { id, ...theme, shape, radius: 14, optics, enabled: refractionTarget != null });
  return <button {...props} type={type} ref={node => { root.current = node; assignRef(ref, node); }}
    className={classes('prism-material', 'prism-button', className)} data-shape={shape} data-prism-control
    data-variant={theme.variant} data-appearance={theme.appearance} data-prism-renderer={renderer}>
    {refractionTarget != null && renderer === 'svg-source' ? <span className="prism-source" ref={node => { source.current = node; if (node) node.inert = true; }} aria-hidden="true"><span className="prism-artwork">{refractionTarget}</span></span> : null}
    <span className="prism-lens" aria-hidden="true" /><span className="prism-content">{children}</span>
  </button>;
});

export const GlassToolbar = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassToolbar({ className, onKeyDown, ...props }, ref) {
  return <GlassSurface {...props} ref={ref} role="toolbar" className={classes('prism-toolbar', className)} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !(event.target instanceof HTMLButtonElement)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const index = buttons.indexOf(event.target); if (index < 0) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next]?.focus();
  }} />;
});
