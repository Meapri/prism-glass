/**
 * Backdrop sampling / hysteresis idea derived from Meapri/liquid-glass-web,
 * commit 1613f8311dbc31bc2331afcfe51a143c56dd6308 (MIT). See NOTICE.md.
 * Reworked as pure color/state functions shared by DOM and media renderers.
 */
import {clamp} from './optics.js';
import type {GlassAppearance,GlassMaterial} from './materials.js';
import type {GlassAdaptationPolicy} from './surface-presets.js';
export type GlassAppearanceMode = GlassAppearance | 'auto' | 'adaptive';
export interface GlassBackdropSample {
  /** Linear-light relative luminance, not gamma-encoded RGB brightness. */
  luminance:number; variance:number; color:readonly [number,number,number];
  source:'css'|'pixels'|'provided'; confidence:number;
}
export interface GlassAdaptiveState { appearance:GlassAppearance; luminance:number; variance:number; at:number; candidate:GlassAppearance; since:number; available:boolean }
export const linearChannel=(value:number)=>value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4);
export const relativeLuminance=(rgb:readonly number[])=>.2126*linearChannel(rgb[0])+.7152*linearChannel(rgb[1])+.0722*linearChannel(rgb[2]);
export function summarizeBackdrop(colors:readonly (readonly number[])[],source:GlassBackdropSample['source'],confidence=1):GlassBackdropSample|null {
  if(!colors.length)return null;
  const color:[number,number,number]=[0,0,0];let mean=0,squared=0;
  for(const rgb of colors){const l=relativeLuminance(rgb);mean+=l;squared+=l*l;for(let c=0;c<3;c++)color[c]+=rgb[c];}
  mean/=colors.length;for(let c=0;c<3;c++)color[c]/=colors.length;
  return {luminance:mean,variance:Math.max(0,squared/colors.length-mean*mean),color,source,confidence};
}
export function validBackdrop(sample:GlassBackdropSample|null|undefined):sample is GlassBackdropSample {
  return !!sample&&Number.isFinite(sample.luminance)&&sample.luminance>=0&&sample.luminance<=1&&Number.isFinite(sample.variance)&&sample.variance>=0&&sample.confidence>0&&sample.color.length===3&&sample.color.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
}
export function updateGlassAdaptation(previous:GlassAdaptiveState|undefined,sample:GlassBackdropSample|null,now:number,fallback:GlassAppearance,policy:GlassAdaptationPolicy='flip'):GlassAdaptiveState {
  if(!validBackdrop(sample))return {appearance:fallback,luminance:.5,variance:0,at:now,candidate:fallback,since:now,available:false};
  const blend=previous?.available?1-Math.exp(-Math.max(0,now-previous.at)/160):1;
  const luminance=(previous?.luminance??sample.luminance)*(1-blend)+sample.luminance*blend;
  const variance=(previous?.variance??sample.variance)*(1-blend)+sample.variance*blend;
  let appearance=previous?.available?previous.appearance:fallback;
  const candidate=policy==='ambient'?fallback:luminance>=.3?'light':luminance<=.18?'dark':appearance;
  const since=previous?.candidate===candidate?previous.since:now;
  if(!previous?.available||policy==='ambient'||now-since>=180)appearance=candidate;
  return {appearance,luminance,variance,at:now,candidate,since,available:true};
}
/** Large surfaces keep their appearance; busy backgrounds increase separation. */
export function adaptGlassMaterial(material:GlassMaterial,state:GlassAdaptiveState):GlassMaterial {
  if(material.variant==='clear'||!state.available)return material;
  const busy=clamp(Math.sqrt(state.variance)*2,0,.55);
  const opposite=material.appearance==='light'?1-state.luminance:state.luminance;
  const alpha=clamp(material.tint[3]+busy*.2+opposite*.08,0,.88);
  return {...material,tint:[material.tint[0],material.tint[1],material.tint[2],alpha],blur:Math.min(24,material.blur+busy*4)};
}
export function blendGlassMaterial(from:GlassMaterial,to:GlassMaterial,amount:number):GlassMaterial {
  const t=clamp(amount,0,1),mix=(a:number,b:number)=>a+(b-a)*t;
  return {...to,tint:from.tint.map((a,i)=>mix(a,to.tint[i])) as [number,number,number,number],blur:mix(from.blur,to.blur),
    saturation:mix(from.saturation,to.saturation),brightness:mix(from.brightness,to.brightness),highlight:mix(from.highlight,to.highlight)};
}
