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
export interface GlassAdaptiveState { appearance:GlassAppearance; luminance:number; variance:number; color:readonly[number,number,number]; at:number; candidate:GlassAppearance; since:number; available:boolean }
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
  if(!validBackdrop(sample))return {appearance:fallback,luminance:.5,variance:0,color:[.5,.5,.5],at:now,candidate:fallback,since:now,available:false};
  const blend=previous?.available?1-Math.exp(-Math.max(0,now-previous.at)/160):1;
  const luminance=(previous?.luminance??sample.luminance)*(1-blend)+sample.luminance*blend;
  const variance=(previous?.variance??sample.variance)*(1-blend)+sample.variance*blend;
  let appearance=previous?.available?previous.appearance:fallback;
  const candidate=policy==='ambient'?fallback:luminance>=.3?'light':luminance<=.18?'dark':appearance;
  const since=previous?.candidate===candidate?previous.since:now;
  if(!previous?.available||policy==='ambient'||now-since>=180)appearance=candidate;
  const color=sample.color.map((v,i)=>(previous?.color[i]??v)*(1-blend)+v*blend) as [number,number,number];
  return {appearance,luminance,variance,color,at:now,candidate,since,available:true};
}
/** Large surfaces keep their appearance; busy backgrounds increase separation. */
export function adaptGlassMaterial(material:GlassMaterial,state:GlassAdaptiveState):GlassMaterial {
  if(material.variant==='clear'||!state.available)return material;
  const busy=clamp(Math.sqrt(state.variance)*2,0,.55);
  const opposite=material.appearance==='light'?1-state.luminance:state.luminance;
  let alpha=clamp(material.tint[3]+busy*.2+opposite*.08,0,.88);
  let tint:[number,number,number]=[material.tint[0],material.tint[1],material.tint[2]];
  const white=material.foreground==='#ffffff', spread=Math.min(.35,Math.sqrt(state.variance));
  const source=state.color.map(value=>clamp(value+(white?spread:-spread),0,1));
  const luma=.2126*source[0]+.7152*source[1]+.0722*source[2];
  const transmitted=source.map(value=>(luma+(value-luma)*material.saturation)*material.brightness*(1-material.dimming));
  const contrast=(rgb:readonly number[])=>{const luminance=relativeLuminance(rgb);return white?1.05/(luminance+.05):(luminance+.05)/.05;};
  const composite=()=>transmitted.map((value,i)=>clamp(value*(1-alpha)+tint[i]*alpha,0,1));
  // A large dark reading surface on a bright image must deepen its tint instead
  // of flipping all labels. Conversely, low-tint light panels need a fill floor.
  const startAlpha=alpha,startTint=[...tint];
  for(let step=1;step<=12&&contrast(composite())<4.5;step++){
    const t=step/12;alpha=startAlpha+(.94-startAlpha)*t;
    tint=startTint.map(value=>value+((white?.12:1)-value)*t) as [number,number,number];
  }
  return {...material,tint:[...tint,alpha],blur:Math.min(24,material.blur+busy*4)};
}
export function blendGlassMaterial(from:GlassMaterial,to:GlassMaterial,amount:number):GlassMaterial {
  const t=clamp(amount,0,1),mix=(a:number,b:number)=>a+(b-a)*t;
  return {...to,tint:from.tint.map((a,i)=>mix(a,to.tint[i])) as [number,number,number,number],blur:mix(from.blur,to.blur),
    saturation:mix(from.saturation,to.saturation),brightness:mix(from.brightness,to.brightness),highlight:mix(from.highlight,to.highlight)};
}
