import { useId, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { lensFor } from '../optics.js';
import { classes, useComponentLens, useControllable, useTheme, type MaterialProps } from './context.js';

export interface GlassTab { value: string; label: ReactNode; content?: ReactNode; disabled?: boolean }
export interface GlassTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>, Omit<MaterialProps, 'refractionTarget'> {
  items: readonly GlassTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
export function GlassTabs({ items, value: controlled, defaultValue, onValueChange, variant, appearance, optics, className, ...props }: GlassTabsProps) {
  if (!items.length || new Set(items.map(item => item.value)).size !== items.length) throw new Error('GlassTabs requires nonempty, unique items');
  const first = items.find(item => !item.disabled)?.value ?? items[0].value;
  const [value, setValue] = useControllable(controlled, defaultValue ?? first, onValueChange);
  const selectedValue = items.findIndex(item => item.value === value && !item.disabled);
  const selected = selectedValue >= 0 ? selectedValue : Math.max(0, items.findIndex(item => !item.disabled));
  const root = useRef<HTMLDivElement | null>(null), source = useRef<HTMLDivElement | null>(null), id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]), theme = useTheme({ variant, appearance });
  const renderer = useComponentLens(root, source, { id, ...theme, enabled: !theme.nested, local: true, animate: true,
    optics: { strength: 9, blur: 0.5, ...optics }, geometry: (width, height) => {
      const cell = (width - 8) / items.length;
      const rtl = root.current && getComputedStyle(root.current).direction === 'rtl';
      return lensFor('capsule', { x: 4 + (rtl ? items.length - 1 - selected : selected) * cell, y: 4, width: cell, height: height - 8 });
    } });
  const tabId = (index: number) => `${id}-tab-${index}`, panelId = (index: number) => `${id}-panel-${index}`;
  return <div className={classes('prism-tabs-group', className)}>
    <div {...props} ref={root} role="tablist" className="prism-material prism-tabs" data-variant={theme.variant}
      data-appearance={theme.appearance} data-prism-renderer={renderer} style={{ '--prism-tab-count': items.length, ...props.style } as React.CSSProperties}>
      <div className="prism-source" ref={source} aria-hidden="true"><div className="prism-artwork"><div className="prism-tabs-highlight" /></div></div>
      <span className="prism-lens" aria-hidden="true" />
      {items.map((item, index) => <button key={item.value} ref={node => { buttons.current[index] = node; }} type="button" role="tab"
        id={tabId(index)} aria-controls={item.content != null ? panelId(index) : undefined} aria-selected={index === selected}
        disabled={item.disabled} tabIndex={index === selected ? 0 : -1} onClick={() => setValue(item.value)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          const available = items.map((candidate, i) => candidate.disabled ? -1 : i).filter(i => i >= 0);
          if (!available.length) return;
          const current = available.indexOf(index), rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          const step = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
          const next = event.key === 'Home' ? available[0] : event.key === 'End' ? available[available.length - 1] : available[(current + step + available.length) % available.length];
          event.preventDefault(); setValue(items[next].value); buttons.current[next]?.focus();
        }}>{item.label}</button>)}
    </div>
    {items.map((item, index) => item.content != null ? <div key={item.value} id={panelId(index)} role="tabpanel" aria-labelledby={tabId(index)}
      hidden={selected !== index} tabIndex={0} className="prism-tab-panel">{item.content}</div> : null)}
  </div>;
}
