import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref, type RefObject } from 'react';
import { createGlass } from '../index.js';
import { lensFor, type Lens, type LensShape } from '../optics.js';
import { getGlassMaterial, materialOptics, observeGlassPreferences, type GlassAppearance, type GlassVariant } from '../materials.js';
import { bindGlassInteraction, stepSpring, type GlassInteraction } from '../motion.js';
import type { GlassController, GlassOptions } from '../types.js';
import { observeGlassBackdrop, type GlassBackdropReader } from '../backdrop.js';
import { adaptGlassMaterial, updateGlassAdaptation, type GlassAdaptiveState, type GlassAppearanceMode } from '../adaptive.js';
import { resolveGlassSurface, type GlassSurfacePreset } from '../surface-presets.js';
import type { GlassMaterial } from '../materials.js';
import type { MediaLens } from '../media-types.js';

export interface GlassTheme { variant: GlassVariant; appearance: GlassAppearance; tintLevel: number; nested: boolean; adaptive: boolean; provided?:boolean }
export const GlassContext = createContext<GlassTheme>({ variant: 'regular', appearance: 'light', tintLevel: 0.5, nested: false, adaptive: false });
export interface GlassProviderProps { children: ReactNode; variant?: GlassVariant; appearance?: GlassAppearanceMode; tintLevel?: number }
export function GlassProvider({ children, variant = 'regular', appearance = 'auto', tintLevel = 0.5 }: GlassProviderProps) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (appearance !== 'auto' && appearance !== 'adaptive') return;
    return observeGlassPreferences(window, preferences => setDark(preferences.dark));
  }, [appearance]);
  return <GlassContext.Provider value={{ variant, appearance: appearance === 'auto' || appearance === 'adaptive' ? dark ? 'dark' : 'light' : appearance, adaptive: appearance === 'adaptive', provided:true, tintLevel, nested: false }}>{children}</GlassContext.Provider>;
}
export interface MaterialProps {
  variant?: GlassVariant;
  appearance?: GlassAppearanceMode;
  preset?: GlassSurfacePreset;
  /** Explicit backdrop source or read-only sample callback for unsupported compositing. */
  backdrop?: Element | GlassBackdropReader;
  tintLevel?: number;
  /** Explicit, decorative source pixels. With no source, the surface uses CSS material. */
  refractionTarget?: ReactNode;
  optics?: Partial<Omit<GlassOptions, 'lens' | 'onStatus'>>;
}
export const MediaContext = createContext<null | {
  register(id: string, read: () => MediaLens | null): () => void;
  invalidate(): void;
  bounds(): DOMRect | undefined;
}>(null);
export const classes = (...values: (string | undefined | false)[]) => values.filter(Boolean).join(' ');
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value); else if (ref) ref.current = value;
}
export function useControllable<T>(controlled: T | undefined, initial: T, notify?: (value: T) => void) {
  const [internal, setInternal] = useState(initial);
  const value = controlled === undefined ? internal : controlled;
  return [value, (next: T) => { if (controlled === undefined) setInternal(next); notify?.(next); }] as const;
}
export function useTheme(props: MaterialProps) {
  const inherited = useContext(GlassContext);
  const [systemDark,setSystemDark]=useState(false);
  useEffect(()=>{if(props.appearance!=='auto'&&props.appearance!=='adaptive')return;return observeGlassPreferences(window,p=>setSystemDark(p.dark));},[props.appearance]);
  const mode=props.appearance;
  return { ...inherited, variant: props.variant ?? inherited.variant,
    appearance: mode==='adaptive'&&inherited.provided?inherited.appearance:mode==='adaptive'||mode==='auto' ? systemDark?'dark' as const:'light' as const : mode??inherited.appearance,
    adaptive: mode==null?inherited.adaptive:mode==='adaptive', tintLevel: props.tintLevel ?? inherited.tintLevel };
}
export function materialStyle(theme: GlassTheme, material = getGlassMaterial(theme.variant, theme.appearance, theme.tintLevel)): CSSProperties {
  const [r, g, b, a] = material.tint;
  const clearAlpha = 1 - (1 - material.dimming) * (1 - a);
  const clearReflection = a * 255 / Math.max(clearAlpha, 0.001);
  return { '--prism-fill': theme.variant === 'clear' ? `rgb(${clearReflection} ${clearReflection} ${clearReflection} / ${clearAlpha})` : `rgb(${r * 255} ${g * 255} ${b * 255} / ${a})`,
    '--prism-blur': `${material.blur}px`, '--prism-saturation': material.saturation, '--prism-brightness': material.brightness,
    '--prism-ink': material.foreground, '--prism-solid': material.opaque } as CSSProperties;
}
export interface LensSpec {
  id: string;
  variant: GlassVariant;
  appearance: GlassAppearance;
  tintLevel?: number;
  adaptive?: boolean;
  preset?: GlassSurfacePreset;
  backdrop?: Element | GlassBackdropReader;
  shape?: LensShape;
  radius?: number;
  optics?: MaterialProps['optics'];
  enabled: boolean;
  nested?: boolean;
  local?: boolean;
  animate?: boolean;
  transient?: boolean;
  pressScale?: number;
  geometry?: (width: number, height: number) => Lens;
}

/** Imperative optical updates keep pointer/spring frames out of React rendering. */
export function useComponentLens(root: RefObject<HTMLElement | null>, source: RefObject<HTMLElement | null>, spec: LensSpec) {
  const media = useContext(MediaContext);
  const useMedia = Boolean(media && !spec.local && !spec.nested && !spec.enabled);
  const latest = useRef(spec); latest.current = spec;
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const element = root.current, target = source.current, win = element?.ownerDocument.defaultView;
    if (!element || !win) return;
    let adaptiveState: GlassAdaptiveState | undefined;
    let controller: GlassController | undefined, frame = 0, time = 0, reducedMotion = false;
    let current: Lens | undefined, painted: Lens | undefined, destination: Lens | undefined;
    let velocity = { x: 0, y: 0 };
    let interaction: GlassInteraction = { press: 0, hover: 0, pointer: [0.5, 0.5], reducedMotion: false };
    const geometry = () => {
      const next = latest.current, width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      return next.geometry?.(width, height) ?? (next.preset ? resolveGlassSurface(next.preset,{width,height,shape:next.shape,radius:next.radius}).lens : undefined) ?? lensFor(next.shape ?? 'rounded-rect', { x: 0, y: 0, width, height, radius: next.radius ?? 16 });
    };
    function paintMaterial(material: GlassMaterial, elevation=1, available=false, separationOverride?:number) {
      const next=latest.current;
      const style=materialStyle({...next,nested:!!next.nested,adaptive:!!next.adaptive,tintLevel:next.tintLevel??.5},material);
      for(const [key,value] of Object.entries(style))element!.style.setProperty(key,String(value));
      element!.dataset.appearance=material.appearance;
      element!.dataset.prismAdaptation=next.adaptive&&!next.transient?(material.variant==='clear'?'clear-static':available?'resolved':'unavailable'):'off';
      if(next.preset)element!.style.setProperty('--prism-elevation',String(elevation));
      const separation=separationOverride??(adaptiveState?.available?1+Math.sqrt(adaptiveState.variance)*1.5+(1-adaptiveState.luminance)*.2:1);
      element!.style.setProperty('--prism-separation',String(separation));
    }
    function write(lens: Lens) {
      current = lens;
      const scale = 1 + (reducedMotion ? 0 : interaction.press) * (latest.current.pressScale ?? 0);
      painted = { ...lens, x: lens.x + lens.width * (1 - scale) / 2, y: lens.y + lens.height * (1 - scale) / 2,
        width: lens.width * scale, height: lens.height * scale, radius: lens.radius * scale };
      for (const [key, value] of Object.entries({ x: painted.x, y: painted.y, width: painted.width, height: painted.height, radius: painted.radius })) {
        element!.style.setProperty(`--prism-lens-${key}`, `${value}px`);
      }
      if (useMedia) { media!.invalidate(); return; }
      const next=latest.current, appearance=next.adaptive&&!next.transient?adaptiveState?.appearance??next.appearance:next.appearance;
      const preset=next.preset?resolveGlassSurface(next.preset,painted,{variant:next.variant,appearance,tintLevel:next.tintLevel}):undefined;
      const base=preset?.material??getGlassMaterial(next.variant,appearance,next.tintLevel);
      const material=adaptiveState&&next.adaptive&&!next.transient?adaptGlassMaterial(base,adaptiveState):base;
      paintMaterial(material,preset?.elevation,adaptiveState?.available);
      if (!target || !next.enabled) return;
      const options = { ...materialOptics(painted, next.variant, next.tintLevel, appearance), ...preset?.optics,
        blur:material.blur,saturation:material.saturation, ...next.optics, lens: painted };
      if (latest.current.transient) options.enabled = (options.enabled ?? true) && interaction.press > 0.01;
      options.strength = (options.strength ?? 0) * (1 + interaction.press * 0.12);
      options.highlight = Math.min(1, (options.highlight ?? 0.4) + interaction.press * 0.18);
      if (!controller) controller = createGlass(target, options); else controller.update(options);
    }
    function tick(now: number) {
      frame = 0; if (!current || !destination) return;
      const dt = time ? (now - time) / 1000 : 1 / 60; time = now;
      const x = stepSpring({ value: current.x, velocity: velocity.x }, destination.x, dt);
      const y = stepSpring({ value: current.y, velocity: velocity.y }, destination.y, dt);
      velocity = { x: x.velocity, y: y.velocity }; write({ ...destination, x: x.value, y: y.value });
      if (x.value !== destination.x || y.value !== destination.y || x.velocity || y.velocity) frame = win!.requestAnimationFrame(tick);
      else time = 0;
    }
    function measure() {
      const next = geometry(); if (!next) return;
      destination = next;
      if (!current || !latest.current.animate || reducedMotion || current.width !== next.width || current.height !== next.height) {
        if (frame) win!.cancelAnimationFrame(frame); frame = 0; time = 0; velocity = { x: 0, y: 0 }; write(next);
      } else if (!frame) frame = win!.requestAnimationFrame(tick);
    }
    refresh.current = measure;
    const unregister = useMedia ? media!.register(spec.id, () => {
      const rect = element.getBoundingClientRect(), bounds = media!.bounds(), lens = painted ?? current ?? geometry();
      if (!bounds || !lens || !rect.width || !rect.height || !element.isConnected || element.closest('[hidden]')) return null;
      return { id: latest.current.id, lens: { ...lens, x: rect.left - bounds.left + lens.x, y: rect.top - bounds.top + lens.y },
        variant: latest.current.variant, appearance: latest.current.adaptive?'adaptive':latest.current.appearance,
        fallbackAppearance:latest.current.appearance,preset:latest.current.preset,tintLevel: latest.current.tintLevel, ...latest.current.optics,
        onAppearance:state=>paintMaterial(state.material,state.elevation,state.available,state.separation),
        press: interaction.press, hover: interaction.hover, pointer: interaction.pointer };
    }) : undefined;
    const backdrop=spec.adaptive&&!spec.transient&&!spec.nested&&!useMedia&&spec.variant!=='clear'?observeGlassBackdrop(element,sample=>{
      const next=latest.current;
      const policy=next.preset?resolveGlassSurface(next.preset,{width:element.clientWidth||1,height:element.clientHeight||1},{variant:next.variant}).adaptation:'flip';
      adaptiveState=updateGlassAdaptation(adaptiveState,sample,win!.performance.now(),next.appearance,policy);
      if(current)write(current);
    },typeof spec.backdrop==='function'?{sample:spec.backdrop}:{source:spec.backdrop}):undefined;
    const feedback = bindGlassInteraction(element, next => { interaction = next; if (current) write(current); });
    const unsubscribe = observeGlassPreferences(win, preferences => { reducedMotion = preferences.reducedMotion; measure(); });
    const observer = new win.ResizeObserver(measure); observer.observe(element); measure();
    return () => {
      observer.disconnect(); backdrop?.destroy(); unregister?.(); unsubscribe(); feedback.destroy(); controller?.destroy();
      if (frame) win.cancelAnimationFrame(frame); refresh.current = () => {};
    };
  }, [root, source, useMedia, media, spec.enabled, spec.nested, spec.id, spec.adaptive, spec.backdrop, spec.variant]);
  useEffect(() => { refresh.current(); });
  return spec.nested ? 'overlay' : useMedia ? 'webgl-media' : spec.enabled ? 'svg-source' : 'css-material';
}
