import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { GlassButton, GlassSurface, type GlassSurfaceProps, type GlassButtonProps } from './surface.js';
import { classes } from './context.js';
import {GlassMediaScene} from './media-scene.js';
import type {GlassMediaSource} from '../media-types.js';

export interface GlassPopoverProps extends Omit<GlassSurfaceProps, 'children' | 'title' | 'onToggle' | 'present'> {
  trigger: ReactNode;
  children: ReactNode;
  /** Accessible name for an icon-only trigger. */
  triggerLabel?: string;
  onOpenChange?: (open: boolean) => void;
  open?:boolean;
  triggerProps?:GlassButtonProps;
  anchorRef?:RefObject<HTMLElement|null>;
  anchorPoint?:{x:number;y:number};
  align?:'start'|'center'|'end';
  placement?:'below'|'overlap';
  source?:RefObject<GlassMediaSource|null>;
  sourceVersion?:string|number;
}
export function GlassPopover({ trigger, triggerLabel, children, onOpenChange, open:controlled, triggerProps, anchorRef, anchorPoint, align='start',placement='below',source,sourceVersion, className, ...props }: GlassPopoverProps) {
  const id = useId(), button = useRef<HTMLButtonElement | null>(null), panel = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const notify = useRef(onOpenChange); notify.current = onOpenChange;
  function place() {
    const anchor = anchorPoint?{left:anchorPoint.x,top:anchorPoint.y,bottom:anchorPoint.y,width:0}:(anchorRef?.current??button.current)?.getBoundingClientRect(), target = panel.current;
    if (!anchor || !target) return;
    const win = target.ownerDocument.defaultView!;
    target.style.maxWidth = `${Math.max(0, win.innerWidth - 24)}px`;
    const box = target.getBoundingClientRect();
    const origin=anchor.left+(align==='center'?(anchor.width-box.width)/2:align==='end'?anchor.width-box.width:0);
    const x = Math.max(12, Math.min(origin, win.innerWidth - box.width - 12));
    const below = placement==='overlap'?anchor.top+(anchorPoint?0:5):anchor.bottom+8, above = anchor.top - box.height - 8;
    const y = below + box.height <= win.innerHeight - 12 ? below : Math.max(12, above);
    target.style.left = `${x}px`; target.style.top = `${y}px`;
  }
  const latestPlace=useRef(place);latestPlace.current=place;
  useEffect(() => {
    const target = panel.current!;
    const toggle = (event: Event) => {
      const next = (event as ToggleEvent).newState === 'open'; setOpen(next); notify.current?.(next);
      if (next) {
        latestPlace.current();
        (target.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]') ?? target).focus({preventScroll:true});
      } else {
        const doc = target.ownerDocument, active = doc.activeElement;
        if (active === doc.body || (active && target.contains(active))) (anchorRef?.current??button.current)?.focus({ preventScroll: true });
      }
    };
    target.addEventListener('toggle', toggle);
    return () => target.removeEventListener('toggle', toggle);
  }, []);
  useEffect(()=>{const target=panel.current;if(controlled===undefined||!target)return;if(controlled&&!target.matches(':popover-open'))target.showPopover();if(!controlled&&target.matches(':popover-open'))target.hidePopover();},[controlled]);
  useEffect(() => {
    if (!open) return;
    place(); const win = panel.current!.ownerDocument.defaultView!;
    win.addEventListener('resize', place); win.addEventListener('scroll', place, true);
    const observer = new win.ResizeObserver(place); observer.observe(panel.current!);
    return () => { win.removeEventListener('resize', place); win.removeEventListener('scroll', place, true); observer.disconnect(); };
  }, [open,anchorPoint?.x,anchorPoint?.y,anchorRef,align,placement]);
  return <><GlassButton {...triggerProps} ref={button} variant={triggerProps?.variant??props.variant} appearance={triggerProps?.appearance??props.appearance} tintLevel={props.tintLevel} dimming={props.dimming} tint={props.tint}
    onClick={event => {triggerProps?.onClick?.(event);if(event.defaultPrevented)return; const target = panel.current!; if (target.matches(':popover-open')) target.hidePopover(); else target.showPopover(); }}
    aria-label={triggerLabel} aria-haspopup={props.role==='menu'?'menu':'dialog'} aria-expanded={open} aria-controls={id}>{trigger}</GlassButton>
    {source?<div id={id} ref={panel} popover="auto" role={props.role??'dialog'} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} tabIndex={-1} className="prism-popover prism-sourced-popover"><GlassMediaScene source={source} sourceVersion={sourceVersion} variant={props.variant??'regular'} appearance={props.appearance} tint={props.tint} dimming={props.dimming} media={{sourceAlignment:'element'}} className="prism-portal-media"><GlassSurface {...props} id={undefined} role={undefined} present={open} onPresenceChange={phase=>{props.onPresenceChange?.(phase);if(panel.current)panel.current.dataset.prismPresence=phase;if(phase==='entering')queueMicrotask(()=>{latestPlace.current();(panel.current?.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')??panel.current)?.focus({preventScroll:true});});}} className={classes('prism-sourced-panel',className)}>{children}</GlassSurface></GlassMediaScene></div>:<GlassSurface {...props} local id={id} ref={panel} popover="auto" role={props.role??'dialog'} tabIndex={props.tabIndex ?? -1} className={classes('prism-popover', className)}>{children}</GlassSurface>}</>;
}
