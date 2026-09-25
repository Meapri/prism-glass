import { clamp, finite, lensFor, type Lens, type LensShape } from './optics.js';
import { getGlassMaterial, type GlassAppearance, type GlassMaterial, type GlassVariant } from './materials.js';
import type { GlassOptions } from './types.js';

export type GlassSurfacePreset = 'navigation' | 'toolbar' | 'tab-bar' | 'search' | 'button' | 'floating-action' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'sheet' | 'media';
export type GlassAdaptationPolicy = 'flip' | 'ambient';
export interface GlassSurfaceProfile {
  label: string; description: string; shape: LensShape; radius: number;
  bevel: number; strength: number; depth: number; curvature: number;
  diffusion: number; elevation: number; adaptation: GlassAdaptationPolicy; variant: GlassVariant;
}
// Authored here from Apple's qualitative size/use guidance. These are not Apple shader constants.
const profiles: Record<GlassSurfacePreset, GlassSurfaceProfile> = {
  navigation: {label:'Navigation',description:'Quiet refraction with continuous separation above scrolling content.',shape:'capsule',radius:28,bevel:7,strength:3.5,depth:.7,curvature:5.8,diffusion:1.05,elevation:.6,adaptation:'flip',variant:'regular'},
  toolbar: {label:'Toolbar',description:'A shared compact surface for a group of actions.',shape:'capsule',radius:24,bevel:8,strength:4,depth:.8,curvature:5.2,diffusion:1,elevation:.7,adaptation:'flip',variant:'regular'},
  'tab-bar': {label:'Tab bar',description:'A broad capsule that remains readable over changing content.',shape:'capsule',radius:30,bevel:10,strength:5,depth:.9,curvature:5,diffusion:1.1,elevation:.85,adaptation:'flip',variant:'regular'},
  search: {label:'Search field',description:'Restrained lensing and extra diffusion behind text input.',shape:'capsule',radius:22,bevel:6,strength:3,depth:.65,curvature:6,diffusion:1.12,elevation:.45,adaptation:'flip',variant:'regular'},
  button: {label:'Button',description:'A small responsive lens with a narrow rounded edge.',shape:'capsule',radius:22,bevel:7,strength:5,depth:.9,curvature:4,diffusion:.92,elevation:.55,adaptation:'flip',variant:'regular'},
  'floating-action': {label:'Floating action',description:'A compact circle with a fuller curved edge and distinct elevation.',shape:'circle',radius:32,bevel:11,strength:8,depth:1.1,curvature:3.2,diffusion:.88,elevation:1,adaptation:'flip',variant:'regular'},
  selection: {label:'Selection',description:'A shallow standalone selection surface; use simple fills when already inside glass.',shape:'capsule',radius:18,bevel:5,strength:2.5,depth:.55,curvature:5.8,diffusion:.85,elevation:.3,adaptation:'flip',variant:'regular'},
  menu: {label:'Menu',description:'Thicker material, soft scattering and a stable reading surface.',shape:'rounded-rect',radius:28,bevel:16,strength:10,depth:1.25,curvature:4.8,diffusion:1.2,elevation:1.5,adaptation:'ambient',variant:'regular'},
  popover: {label:'Popover',description:'A focused floating panel with concentrated edge refraction.',shape:'rounded-rect',radius:28,bevel:18,strength:11,depth:1.35,curvature:5.2,diffusion:1.25,elevation:1.7,adaptation:'ambient',variant:'regular'},
  sidebar: {label:'Sidebar',description:'A large ambient surface with quiet center and stable label appearance.',shape:'rounded-rect',radius:30,bevel:20,strength:10,depth:1.4,curvature:6,diffusion:1.25,elevation:1.25,adaptation:'ambient',variant:'regular'},
  sheet: {label:'Sheet',description:'Substantial raised glass with the widest edge and deepest scattering.',shape:'rounded-rect',radius:36,bevel:24,strength:14,depth:1.65,curvature:5.5,diffusion:1.4,elevation:2,adaptation:'ambient',variant:'regular'},
  media: {label:'Media overlay',description:'Clear glass for bold white controls over rich imagery, with local dimming.',shape:'capsule',radius:32,bevel:9,strength:7,depth:1,curvature:4,diffusion:1,elevation:.8,adaptation:'flip',variant:'clear'},
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
  const lens=lensFor(shape,{...bounds,x:bounds.x??0,y:bounds.y??0,radius:bounds.radius??Math.min(profile.radius,short*.24)});
  const material=getGlassMaterial(options.variant??profile.variant,options.appearance,options.tintLevel);
  const size=clamp(Math.sqrt(short/100),.65,1.4);
  material.blur=clamp(material.blur*profile.diffusion,0,24);
  const optics: GlassOptions={lens,surface:'rim',ior:1.5,depth:profile.depth,curvature:profile.curvature,
    strength:Math.min(profile.strength*size,short*.18),bevel:Math.min(profile.bevel*size,short*.3),
    blur:material.blur,saturation:material.saturation,blurMode:'uniform',highlight:material.highlight};
  return {lens,optics,material,elevation:profile.elevation,adaptation:profile.adaptation};
}
