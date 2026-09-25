import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GlassButton, GlassSurface, type GlassSurfaceProps } from './surface.js';
import { classes } from './context.js';

export interface GlassPopoverProps extends Omit<GlassSurfaceProps, 'children' | 'title' | 'onToggle'> {
  trigger: ReactNode;
  children: ReactNode;
  /** Accessible name for an icon-only trigger. */
  triggerLabel?: string;
  onOpenChange?: (open: boolean) => void;
}
export function GlassPopover({ trigger, triggerLabel, children, onOpenChange, className, ...props }: GlassPopoverProps) {
  const id = useId(), button = useRef<HTMLButtonElement | null>(null), panel = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const notify = useRef(onOpenChange); notify.current = onOpenChange;
  function place() {
    const anchor = button.current?.getBoundingClientRect(), target = panel.current;
    if (!anchor || !target) return;
    const win = target.ownerDocument.defaultView!;
    target.style.maxWidth = `${Math.max(0, win.innerWidth - 24)}px`;
    const box = target.getBoundingClientRect();
    const x = Math.max(12, Math.min(anchor.left, win.innerWidth - box.width - 12));
    const below = anchor.bottom + 8, above = anchor.top - box.height - 8;
    const y = below + box.height <= win.innerHeight - 12 ? below : Math.max(12, above);
    target.style.left = `${x}px`; target.style.top = `${y}px`;
  }
  useEffect(() => {
    const target = panel.current!;
    const toggle = (event: Event) => {
      const next = (event as ToggleEvent).newState === 'open'; setOpen(next); notify.current?.(next);
      if (next) {
        place();
        (target.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]') ?? target).focus();
      } else {
        const doc = target.ownerDocument, active = doc.activeElement;
        if (active === doc.body || (active && target.contains(active))) button.current?.focus({ preventScroll: true });
      }
    };
    target.addEventListener('toggle', toggle);
    return () => target.removeEventListener('toggle', toggle);
  }, []);
  useEffect(() => {
    if (!open) return;
    place(); const win = panel.current!.ownerDocument.defaultView!;
    win.addEventListener('resize', place); win.addEventListener('scroll', place, true);
    const observer = new win.ResizeObserver(place); observer.observe(panel.current!);
    return () => { win.removeEventListener('resize', place); win.removeEventListener('scroll', place, true); observer.disconnect(); };
  }, [open]);
  return <><GlassButton ref={button} variant={props.variant} appearance={props.appearance}
    onClick={() => { const target = panel.current!; if (target.matches(':popover-open')) target.hidePopover(); else target.showPopover(); }}
    aria-label={triggerLabel} aria-haspopup="dialog" aria-expanded={open} aria-controls={id}>{trigger}</GlassButton>
    <GlassSurface {...props} local id={id} ref={panel} popover="auto" role="dialog" tabIndex={props.tabIndex ?? -1} className={classes('prism-popover', className)}>{children}</GlassSurface></>;
}
