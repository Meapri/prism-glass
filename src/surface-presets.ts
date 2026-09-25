import { clamp, finite, lensFor, type Lens, type LensShape } from './optics.js';
import { getLensMaterial, materialOptics, type GlassAppearance, type GlassMaterial, type GlassVariant, type GlassTint } from './materials.js';
import type { GlassOptions } from './types.js';

export type GlassSurfacePreset = 'navigation' | 'toolbar' | 'tab-bar' | 'search' | 'button' | 'floating-action' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'sheet' | 'media' | 'dock' | 'dock-item' | 'alert' | 'action-sheet' | 'notification' | 'chip' | 'widget' | 'control' | 'live-activity' | 'input-accessory' | 'edit-menu' | 'page-control';
export type GlassAdaptationPolicy = 'flip' | 'ambient';
export interface GlassSurfaceProfile {
  label: string; description: string; shape: LensShape; radius: number;
  bevel: number; strength: number; depth: number; curvature: number;
  diffusion: number; elevation: number; adaptation: GlassAdaptationPolicy; variant: GlassVariant;
  tint?:GlassTint; dimming?:number; brightness?:number;
}
// Authored here from Apple's qualitative size/use guidance. These are not Apple shader constants.
const profiles: Record<GlassSurfacePreset, GlassSurfaceProfile> = {
  navigation: {label:'Navigation',description:'Quiet refraction with continuous separation above scrolling content.',shape:'capsule',radius:28,bevel:44,strength:22,depth:0.85,curvature:4.1,diffusion:0.9,elevation:.6,adaptation:'flip',variant:'regular'},
  toolbar: {label:'Toolbar',description:'A shared compact surface for a group of actions.',shape:'capsule',radius:24,bevel:48,strength:25,depth:0.9,curvature:4,diffusion:0.9,elevation:.7,adaptation:'flip',variant:'regular'},
  'tab-bar': {label:'Tab bar',description:'A broad capsule that remains readable over changing content.',shape:'capsule',radius:30,bevel:50,strength:28,depth:1,curvature:4,diffusion:1,elevation:.85,adaptation:'flip',variant:'regular'},
  search: {label:'Search field',description:'Restrained lensing and extra diffusion behind text input.',shape:'capsule',radius:22,bevel:44,strength:20,depth:0.85,curvature:4.2,diffusion:1,elevation:.45,adaptation:'flip',variant:'regular'},
  button: {label:'Button',description:'A small responsive lens with a narrow rounded edge.',shape:'capsule',radius:22,bevel:50,strength:28,depth:1,curvature:4,diffusion:0.9,elevation:.55,adaptation:'flip',variant:'regular'},
  'floating-action': {label:'Floating action',description:'A compact circle with a fuller curved edge and distinct elevation.',shape:'circle',radius:32,bevel:52,strength:32,depth:1.05,curvature:3.9,diffusion:1,elevation:1,adaptation:'flip',variant:'regular'},
  selection: {label:'Selection',description:'A shallow standalone selection surface; use simple fills when already inside glass.',shape:'capsule',radius:18,bevel:40,strength:18,depth:0.8,curvature:4.2,diffusion:0.8,elevation:.3,adaptation:'flip',variant:'regular'},
  menu: {label:'Menu',description:'Thicker material, soft scattering and a stable reading surface.',shape:'continuous',radius:28,bevel:50,strength:30,depth:1,curvature:4,diffusion:1,elevation:1.5,adaptation:'ambient',variant:'regular'},
  popover: {label:'Popover',description:'A focused floating panel with concentrated edge refraction.',shape:'continuous',radius:28,bevel:50,strength:28,depth:1,curvature:4,diffusion:1,elevation:1.7,adaptation:'ambient',variant:'regular'},
  sidebar: {label:'Sidebar',description:'A large ambient surface with quiet center and stable label appearance.',shape:'continuous',radius:30,bevel:54,strength:30,depth:1.05,curvature:4.2,diffusion:1.05,elevation:1.25,adaptation:'ambient',variant:'regular'},
  sheet: {label:'Sheet',description:'Substantial raised glass with the widest edge and deepest scattering.',shape:'continuous',radius:36,bevel:58,strength:34,depth:1.15,curvature:4,diffusion:1.1,elevation:2,adaptation:'ambient',variant:'regular'},
  media: {label:'Media overlay',description:'Clear glass for bold white controls over rich imagery, with local dimming.',shape:'capsule',radius:32,bevel:50,strength:64,depth:1,curvature:4,diffusion:1,elevation:.8,adaptation:'flip',variant:'clear'},
  'dock': {label:'Dock',description:'A clear floating dock with restrained reflection and a broad curved perimeter.',shape:'continuous',radius:36,bevel:50,strength:64,depth:1,curvature:4,diffusion:0.85,elevation:0.9,adaptation:'flip',variant:'clear',tint:[1,1,1,.035],dimming:0,brightness:1,},
  'dock-item': {label:'Dock item',description:'Clear home-style icon surface with a continuous rounded silhouette.',shape:'continuous',radius:20,bevel:50,strength:64,depth:1,curvature:4,diffusion:0.8,elevation:0.6,adaptation:'flip',variant:'clear',tint:[1,1,1,.04],dimming:0,brightness:1,},
  'alert': {label:'Alert',description:'A compact reading surface for confirmation and critical information.',shape:'continuous',radius:34,bevel:50,strength:28,depth:1,curvature:4,diffusion:1.15,elevation:1.5,adaptation:'ambient',variant:'regular',},
  'action-sheet': {label:'Action sheet',description:'A compact group of related choices with filled inner actions.',shape:'continuous',radius:30,bevel:50,strength:28,depth:1,curvature:4,diffusion:1.05,elevation:1.5,adaptation:'ambient',variant:'regular',},
  'notification': {label:'Notification',description:'Concise information in a raised, readable banner.',shape:'continuous',radius:30,bevel:50,strength:28,depth:1,curvature:4,diffusion:1.05,elevation:1.1,adaptation:'ambient',variant:'regular',},
  'chip': {label:'Chip',description:'A custom compact toggle using the public glass control treatment.',shape:'capsule',radius:18,bevel:50,strength:24,depth:1,curvature:4,diffusion:1,elevation:0.45,adaptation:'flip',variant:'regular',},
  'widget': {label:'Widget',description:'A clear system-style widget surface; content keeps its own hierarchy.',shape:'continuous',radius:28,bevel:50,strength:64,depth:1,curvature:4,diffusion:1,elevation:0.8,adaptation:'ambient',variant:'clear',tint:[1,1,1,.035],dimming:0,brightness:1,},
  'control': {label:'Control tile',description:'A compact toggle or action with a clear resting material.',shape:'continuous',radius:28,bevel:50,strength:64,depth:1,curvature:4,diffusion:1,elevation:0.7,adaptation:'flip',variant:'clear',tint:[1,1,1,.055],dimming:0,brightness:1,},
  'live-activity': {label:'Live Activity',description:'A stable reading panel for ongoing status and focused actions.',shape:'continuous',radius:28,bevel:50,strength:28,depth:1,curvature:4,diffusion:1,elevation:1,adaptation:'ambient',variant:'regular',},
  'input-accessory': {label:'Input accessory',description:'A shared glass bar above the system keyboard.',shape:'capsule',radius:24,bevel:46,strength:24,depth:0.9,curvature:4,diffusion:1,elevation:0.55,adaptation:'flip',variant:'regular',},
  'edit-menu': {label:'Edit menu',description:'Compact horizontal editing actions over selected content.',shape:'capsule',radius:26,bevel:48,strength:25,depth:1,curvature:4,diffusion:1,elevation:1.2,adaptation:'flip',variant:'regular',},
  'page-control': {label:'Page control',description:'A compact navigation capsule visible during interaction.',shape:'capsule',radius:14,bevel:40,strength:18,depth:0.8,curvature:4,diffusion:1,elevation:0.3,adaptation:'flip',variant:'regular',},
};
for (const value of Object.values(profiles)) Object.freeze(value);
export const glassSurfacePresets: Readonly<Record<GlassSurfacePreset, Readonly<GlassSurfaceProfile>>> = Object.freeze(profiles);
export function getGlassSurfaceProfile(name: GlassSurfacePreset): Readonly<GlassSurfaceProfile> {
  if (!Object.hasOwn(profiles, name)) throw new TypeError('Unknown glass surface preset');
  return profiles[name];
}
export interface GlassSurfaceResolution { lens: Lens; optics: GlassOptions; material: GlassMaterial; elevation: number; adaptation: GlassAdaptationPolicy }
export function resolveGlassSurface(preset: GlassSurfacePreset, bounds: {width:number;height:number;x?:number;y?:number;radius?:number;shape?:LensShape}, options: {variant?:GlassVariant;appearance?:GlassAppearance;tintLevel?:number} = {}): GlassSurfaceResolution {
  const profile=getGlassSurfaceProfile(preset), short=Math.min(bounds.width,bounds.height);
  finite(short,'surface size');
  const shape=bounds.shape??profile.shape;
  const lens=lensFor(shape,{...bounds,x:bounds.x??0,y:bounds.y??0,radius:bounds.radius??Math.min(profile.radius,short/2)});
  const variant=options.variant??profile.variant;
  const material=getLensMaterial(lens,variant,options.appearance,options.tintLevel);
  if(profile.tint)material.tint=profile.tint;
  if(profile.dimming!==undefined)material.dimming=profile.dimming;
  if(profile.brightness!==undefined)material.brightness=profile.brightness;
  const native=materialOptics(lens,variant,options.tintLevel,options.appearance);
  const bevel=Math.min(short/2,native.bevel!*profile.bevel/50);
  material.blur=clamp(material.blur*profile.diffusion,0,24);
  const optics: GlassOptions={lens,surface:'rim',ior:1.5,depth:profile.depth,curvature:clamp(bevel/8*profile.curvature/4,2,8),
    strength:Math.min(64,native.strength!*profile.strength/(profile.variant==='clear'?64:28)),bevel,
    blur:material.blur,saturation:material.saturation,blurMode:'uniform',highlight:material.highlight};
  return {lens,optics,material,elevation:profile.elevation,adaptation:profile.adaptation};
}
