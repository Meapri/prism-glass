import { forwardRef, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';
import { lensFor } from '../optics.js';
import { assignRef, classes, materialStyle, useComponentLens, useControllable, useTheme, type MaterialProps } from './context.js';

export interface GlassSwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'>, Omit<MaterialProps, 'refractionTarget' | 'preset' | 'backdrop' | 'present' | 'onPresenceChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
}
export const GlassSwitch = forwardRef<HTMLButtonElement, GlassSwitchProps>(function GlassSwitch(
  { checked: controlled, defaultChecked = false, onCheckedChange, optics, variant, appearance, tintLevel, dimming, tint, className, style, onClick, name, value = 'on', ...props }, ref) {
  const [checked, setChecked] = useControllable(controlled, defaultChecked, onCheckedChange);
  const root = useRef<HTMLButtonElement | null>(null), source = useRef<HTMLSpanElement | null>(null), id = useId();
  const theme = useTheme({ variant, appearance, tintLevel, dimming, tint });
  const renderer = useComponentLens(root, source, { id, ...theme, enabled: !theme.nested, local: true, animate: true, transient: true, pressScale: 0.1,
    optics: { blur: 0.5, saturation: 1, strength: 5, bevel: 7, surface: 'rim', curvature: 4, depth: 1, ...optics },
    geometry: (width, height) => {
      const rtl = root.current && getComputedStyle(root.current).direction === 'rtl';
      return lensFor('capsule', { x: checked !== Boolean(rtl) ? width - 38 : 2, y: (height - 24) / 2, width: 36, height: 24 });
    } });
  return <><button {...props} name={undefined} type="button" role="switch" aria-checked={checked}
    ref={node => { root.current = node; assignRef(ref, node); }} className={classes('prism-material', 'prism-switch', className)}
    data-variant={theme.variant} data-appearance={theme.appearance} data-prism-renderer={renderer} data-checked={checked} data-prism-control
    style={{ ...materialStyle(theme), ...style }}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) setChecked(!checked); }}>
    <span className="prism-source" ref={source} aria-hidden="true"><span className="prism-artwork"><span className="prism-switch-track"><span className="prism-switch-fill" /></span></span></span>
    <span className="prism-lens" aria-hidden="true" />
  </button>{name && checked ? <input type="hidden" name={name} value={value} disabled={props.disabled} /> : null}</>;
});

export interface GlassSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'>, Omit<MaterialProps, 'refractionTarget' | 'preset' | 'backdrop' | 'present' | 'onPresenceChange'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
}
export const GlassSlider = forwardRef<HTMLInputElement, GlassSliderProps>(function GlassSlider(
  { value: controlled, defaultValue = 50, min = 0, max = 100, step = 1, onValueChange, optics, variant, appearance, tintLevel, dimming, tint, className, style, dir, ...props }, ref) {
  const [value, setValue] = useControllable(controlled, defaultValue, onValueChange);
  const low = Number(min), high = Number(max);
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low || !Number.isFinite(value)) throw new RangeError('GlassSlider requires finite min < max and a finite value');
  const bounded = Math.min(high, Math.max(low, value)), progress = (bounded - low) / (high - low);
  const root = useRef<HTMLSpanElement | null>(null), source = useRef<HTMLSpanElement | null>(null), id = useId();
  const theme = useTheme({ variant, appearance, tintLevel, dimming, tint });
  const renderer = useComponentLens(root, source, { id, ...theme, enabled: !theme.nested, local: true, transient: true, pressScale: 0.12,
    optics: { blur: 0.4, saturation: 1, strength: 3.5, bevel: 6, surface: 'rim', curvature: 4, depth: 1, ...optics },
    geometry: (width, height) => {
      const rtl = root.current && getComputedStyle(root.current).direction === 'rtl';
      return lensFor('capsule', { x: (width - 36) * (rtl ? 1 - progress : progress), y: (height - 26) / 2, width: 36, height: 26 });
    } });
  return <span ref={root} dir={dir} className={classes('prism-material', 'prism-slider', className)}
    data-variant={theme.variant} data-appearance={theme.appearance} data-prism-renderer={renderer} data-disabled={props.disabled}
    style={{ ...materialStyle(theme), '--prism-progress': `${progress * 100}%`, ...style } as React.CSSProperties}>
    <span className="prism-source" ref={source} aria-hidden="true"><span className="prism-artwork"><span className="prism-slider-track"><span className="prism-slider-fill" /></span></span></span>
    <span className="prism-lens" aria-hidden="true" />
    <input {...props} ref={ref} type="range" min={min} max={max} step={step} value={bounded} data-prism-control
      onChange={event => setValue(event.currentTarget.valueAsNumber)} />
  </span>;
});
