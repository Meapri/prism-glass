import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import type { LensShape } from '../optics.js';
import { assignRef, classes, materialStyle, GlassContext, useComponentLens, useTheme, type MaterialProps } from './context.js';
import { getGlassSurfaceProfile } from '../surface-presets.js';
import { lensFor } from '../optics.js';

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement>, MaterialProps {
  shape?: LensShape;
  radius?: number;
  /** Keep top-layer surfaces (for example popovers) independent of a media scene. */
  local?: boolean;
}
export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { children, refractionTarget, optics, variant, appearance, tintLevel, dimming, tint, preset, backdrop, present, onPresenceChange, shape:givenShape, radius:givenRadius, local = false, className, style, ...props }, ref) {
  const root = useRef<HTMLDivElement | null>(null), source = useRef<HTMLDivElement | null>(null);
  const shape=givenShape??(preset?getGlassSurfaceProfile(preset).shape:'rounded-rect');
  const radius=givenRadius??(preset?getGlassSurfaceProfile(preset).radius:28);
  const theme = useTheme({ variant:variant??(preset?getGlassSurfaceProfile(preset).variant:undefined), appearance, tintLevel, dimming, tint }), id = useId();
  const renderer = useComponentLens(root, source, { id, ...theme, preset, backdrop, present, onPresenceChange, shape, radius:givenRadius??(preset?undefined:radius), local, optics, enabled: refractionTarget != null });
  return <div {...props} ref={node => { root.current = node; assignRef(ref, node); }}
    className={classes('prism-material', 'prism-surface', className)} data-variant={theme.variant} data-appearance={theme.appearance}
    data-prism-presence={present===undefined?undefined:"managed"} data-prism-renderer={renderer} data-preset={preset} data-shape={shape} style={{ ...materialStyle(theme), borderRadius: shape === 'circle' || shape === 'ellipse' ? '50%' : shape === 'capsule' ? 999 : radius, ...style }}>
    {refractionTarget != null && renderer === 'svg-source' ? <div className="prism-source-mask"><div className="prism-source" ref={node => { source.current = node; if (node) node.inert = true; }} aria-hidden="true"><div className="prism-artwork">{refractionTarget}</div></div></div> : null}
    <span className="prism-lens" aria-hidden="true" />
    <div className="prism-content"><GlassContext.Provider value={{ ...theme, nested: true }}>{children}</GlassContext.Provider></div>
  </div>;
});

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, MaterialProps {
  shape?: 'capsule' | 'rounded-rect' | 'continuous' | 'circle';
  radius?:number;
  size?:'small'|'regular'|'large'|'extra-large';
  emphasis?:'glass'|'prominent'|'plain'|'bordered';
  intent?:'default'|'destructive';
  loading?:boolean;
  icon?:ReactNode;
}
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { children, refractionTarget, optics, variant, appearance, tintLevel, dimming, tint, preset, backdrop, present, onPresenceChange, shape:givenShape, radius:givenRadius, size='regular', emphasis='glass', intent='default', loading=false, icon, disabled=false, className, style, type = 'button', ...props }, ref) {
  const root = useRef<HTMLButtonElement | null>(null), source = useRef<HTMLSpanElement | null>(null);
  const profile=preset?getGlassSurfaceProfile(preset):undefined;
  const shape=givenShape??(profile?.shape==='circle'?'circle':profile?.shape==='continuous'?'continuous':'capsule');
  const radius=givenRadius??profile?.radius??12;
  const effectiveTint=emphasis==='prominent'&&!disabled?(tint??(intent==='destructive'?[1,.231,.188,1] as const:[0,.533,1,1] as const)):tint;
  const theme = useTheme({ variant:variant??(preset?getGlassSurfaceProfile(preset).variant:undefined), appearance, tintLevel, dimming, tint:effectiveTint }), id = useId();
  const renderer = useComponentLens(root, source, { id, ...theme, preset, backdrop, present, onPresenceChange, shape, radius, optics, local:emphasis==='plain'||emphasis==='bordered', enabled: refractionTarget != null, pressScale: 0.06,
    geometry: (width, height) => {
      const configured = getComputedStyle(root.current!).getPropertyValue('--prism-control-height').trim();
      const h = Math.min(height, configured.endsWith('%') ? height * parseFloat(configured) / 100 : parseFloat(configured) || height);
      const w = shape === 'circle' ? h : width;
      const dpr=root.current!.ownerDocument.defaultView!.devicePixelRatio||1;
      return lensFor(shape, { x: (width - w) / 2, y: Math.round((height - h) / 2*dpr)/dpr, width: w, height: h, radius });
    } });
  return <button {...props} type={type} disabled={disabled||loading} aria-busy={loading||undefined} ref={node => { root.current = node; assignRef(ref, node); }}
    className={classes('prism-material', 'prism-button', className)} data-shape={shape} data-preset={preset} data-prism-control
    data-size={size} data-emphasis={emphasis} data-intent={intent} data-loading={loading||undefined}
    data-variant={theme.variant} data-appearance={theme.appearance} data-prism-presence={present===undefined?undefined:"managed"} data-prism-renderer={renderer} style={{ ...materialStyle(theme), ...((shape==='rounded-rect'||shape==='continuous')?{borderRadius:radius}:{}), ...style }}>
    {refractionTarget != null && renderer === 'svg-source' ? <span className="prism-source-mask"><span className="prism-source" ref={node => { source.current = node; if (node) node.inert = true; }} aria-hidden="true"><span className="prism-artwork">{refractionTarget}</span></span></span> : null}
    <span className="prism-lens" aria-hidden="true" /><span className="prism-content">{loading?<span className="prism-spinner prism-spinner-small" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--prism-spoke':i} as import('react').CSSProperties}/>)}</span>:icon}{children}</span>
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
