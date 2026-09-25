import {clamp,finite} from './optics.js';
import {observeGlassPreferences} from './materials.js';
export type GlassPresencePhase='hidden'|'entering'|'shown'|'exiting';
export interface GlassPresenceFrame {progress:number;lensing:number;diffusion:number;material:number;edge:number;contentOpacity:number;contentBlur:number;contentScale:number}
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
/** Web calibration of materialize: optical formation and content resolve share one clock. */
export function glassPresenceFrame(progress:number,reducedMotion=false):GlassPresenceFrame {
  const p=clamp(finite(progress,'presence'),0,1),material=smooth(0,1,p);
  return {progress:p,lensing:material,diffusion:material,material,edge:smooth(0,.8,p),
    contentOpacity:material,contentBlur:reducedMotion?0:8*Math.pow(1-p,1.5),contentScale:1};
}
export interface GlassPresenceOptions {
  visible?:boolean;
  /** Native popovers manage their own display/top layer. */
  manageVisibility?:boolean;
  onFrame?:(frame:GlassPresenceFrame)=>void;
  onPhase?:(phase:GlassPresencePhase)=>void;
}
export interface GlassPresenceController {setVisible(visible:boolean):void;getState():{phase:GlassPresencePhase;progress:number};destroy():void}
export function createGlassPresence(element:HTMLElement,options:GlassPresenceOptions={}):GlassPresenceController {
  const win=element.ownerDocument.defaultView;if(!win)throw new Error('A document window is required');
  const manage=options.manageVisibility??true;
  let target=options.visible?1:0,value=target,from=value,started=0,duration=0,frame=0,dead=false,reduced=false;
  let phase:GlassPresencePhase=target?'shown':'hidden';
  const names=['--prism-presence','--prism-material','--prism-diffusion','--prism-edge','--prism-content-opacity','--prism-content-blur','--prism-content-scale','visibility','pointer-events'];
  const initial=names.map(name=>[name,element.style.getPropertyValue(name)]as const),owned=new Map<string,string>();
  const original={hidden:element.hidden,inert:element.inert,aria:element.getAttribute('aria-hidden'),phase:element.getAttribute('data-prism-presence')};
  let ownedHidden=element.hidden,ownedInert=element.inert,ownedAria=element.getAttribute('aria-hidden');
  function property(name:string,value:string){if(owned.get(name)!==value){if(value)element.style.setProperty(name,value);else element.style.removeProperty(name);owned.set(name,value);}}
  function state(next:GlassPresencePhase){if(phase!==next){phase=next;options.onPhase?.(phase);}element.dataset.prismPresence=phase;}
  function paint(){const sample=glassPresenceFrame(value,reduced);
    const values=[sample.progress,sample.material,sample.diffusion,sample.edge,sample.contentOpacity,`${sample.contentBlur}px`,sample.contentScale];
    values.forEach((v,i)=>property(names[i],String(v)));
    property('visibility',phase==='hidden'?'hidden':initial.find(([name])=>name==='visibility')![1]);
    property('pointer-events',target?initial.find(([name])=>name==='pointer-events')![1]:'none');
    element.inert=ownedInert=target?original.inert:true;
    ownedAria=target?original.aria:'true';if(ownedAria==null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',ownedAria);
    if(manage)element.hidden=ownedHidden=phase==='hidden';
    element.dataset.prismPresence=phase;options.onFrame?.(sample);
  }
  // The frame already shapes formation with smoothstep. Easing entry again made
  // glass appear almost immediately, ahead of native materialize's gradual reveal.
  function advance(now:number){if(!duration)return;const t=clamp((now-started)/duration,0,1);const eased=target||reduced?t:1-Math.pow(1-t,3);value=from+(target-from)*eased;if(t===1){value=target;duration=0;state(target?'shown':'hidden');}}
  function tick(now:number){frame=0;if(dead)return;advance(now);paint();if(duration)frame=win!.requestAnimationFrame(tick);}
  function setVisible(visible:boolean){if(dead)return;if(typeof visible!=='boolean')throw new TypeError('visible must be boolean');
    const next=visible?1:0;if(next===target)return;const now=win!.performance.now();advance(now);target=next;from=value;started=now;
    duration=reduced?80:(next?340:270)*Math.max(.2,Math.abs(target-from));
    state(next?'entering':'exiting');if(manage)element.hidden=ownedHidden=false;paint();if(!frame)frame=win!.requestAnimationFrame(tick);
  }
  const unsubscribe=observeGlassPreferences(win,p=>{reduced=p.reducedMotion;if(reduced&&duration){from=value;started=win.performance.now();duration=80;}paint();});
  return {setVisible,getState:()=>({phase,progress:value}),destroy(){if(dead)return;dead=true;if(frame)win.cancelAnimationFrame(frame);unsubscribe();
    for(const [name,value]of initial)if(element.style.getPropertyValue(name)===owned.get(name)){if(value)element.style.setProperty(name,value);else element.style.removeProperty(name);}
    if(manage&&element.hidden===ownedHidden)element.hidden=original.hidden;if(element.inert===ownedInert)element.inert=original.inert;
    if(element.getAttribute('aria-hidden')===ownedAria){if(original.aria==null)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden',original.aria);}
    if(element.dataset.prismPresence===phase){if(original.phase==null)element.removeAttribute('data-prism-presence');else element.dataset.prismPresence=original.phase;}
  }};
}
