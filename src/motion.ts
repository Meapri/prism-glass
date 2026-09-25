import { clamp, finite } from './optics.js';
import { joinGlassLightField } from './illumination.js';
import { observeGlassPreferences } from './materials.js';

export interface SpringState { value: number; velocity: number }
/** Semi-implicit spring with bounded substeps, stable after a suspended tab resumes. */
export function stepSpring(state: SpringState, target: number, seconds: number,
  stiffness = 360, damping = 32): SpringState {
  for (const [name, value] of Object.entries({ value: state.value, velocity: state.velocity, target, seconds, stiffness, damping })) finite(value, name);
  if (seconds < 0 || stiffness <= 0 || damping <= 0) throw new RangeError('Invalid spring parameters');
  let { value, velocity } = state;
  let remaining = Math.min(seconds, 0.064);
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120);
    velocity += ((target - value) * stiffness - velocity * damping) * dt;
    value += velocity * dt; remaining -= dt;
  }
  if (Math.abs(value - target) < 0.0005 && Math.abs(velocity) < 0.005) return { value: target, velocity: 0 };
  return { value, velocity };
}

export interface GlassInteraction { press: number; hover: number; pointer: readonly [number, number]; reducedMotion: boolean; illumination?:number; illuminationPointer?:readonly[number,number] }
export interface GlassInteractionController { destroy(): void }
const boundElements=new WeakSet<HTMLElement>();
/** Local input and neighboring illumination; the stable hit target is never transformed. */
export function bindGlassInteraction(element: HTMLElement, onChange?: (state: GlassInteraction) => void): GlassInteractionController {
  const win=element.ownerDocument.defaultView;
  if(!win)throw new Error('A document window is required');
  let dead=false,frame=0,lastTime=0,target=0,hover=0,reducedMotion=false,highContrast=false;
  let pointerId:number|null=null,keyboard=false,pressedAt=0,releaseTimer=0;
  let spring:SpringState={value:0,velocity:0},pointer:readonly[number,number]=[.5,.5],near:readonly[number,number]=[.5,.5],illumination=0;
  const names=['--prism-press','--prism-pointer-x','--prism-pointer-y','--prism-near-glow','--prism-near-x','--prism-near-y'];
  const initial=names.map(name=>[name,element.style.getPropertyValue(name)]as const),owned=new Map<string,string>();
  boundElements.add(element);
  const disabled=()=>element.matches(':disabled')||element.getAttribute('aria-disabled')==='true'||element.inert||element.hidden;
  const origin=(event:Event)=>event.composedPath().find(node=>node instanceof win.HTMLElement&&boundElements.has(node)&&node.dataset.prismRenderer!=='overlay');
  function write(){
    const press=clamp(spring.value,0,1),level=highContrast?0:illumination;
    const values=[String(press),`${pointer[0]*100}%`,`${pointer[1]*100}%`,String(level),`${near[0]*100}%`,`${near[1]*100}%`];
    names.forEach((name,i)=>{if(owned.get(name)!==values[i]){element.style.setProperty(name,values[i]);owned.set(name,values[i]);}});
    onChange?.({press,hover,pointer,reducedMotion,illumination:level,illuminationPointer:near});
  }
  const field=joinGlassLightField(element,sample=>{if(dead)return;illumination=sample.energy;near=sample.point;write();});
  function tick(time:number){
    frame=0;if(disabled())target=0;
    spring=reducedMotion?{value:target,velocity:0}:stepSpring(spring,target,lastTime?(time-lastTime)/1000:1/60,target?620:300,target?38:30);
    lastTime=time;write();
    const rect=element.getBoundingClientRect();field.emit(highContrast?0:clamp(spring.value,0,1),rect.left+pointer[0]*rect.width,rect.top+pointer[1]*rect.height);
    if(spring.value!==target||spring.velocity!==0)frame=win!.requestAnimationFrame(tick);else lastTime=0;
  }
  function schedule(){if(!dead&&!frame)frame=win!.requestAnimationFrame(tick);}
  function position(event:PointerEvent){const r=element.getBoundingClientRect();pointer=[clamp((event.clientX-r.left)/Math.max(1,r.width),0,1),clamp((event.clientY-r.top)/Math.max(1,r.height),0,1)];}
  const enter=()=>{if(!disabled()){hover=1;schedule();}};
  const move=(event:PointerEvent)=>{if(!disabled()&&(pointerId===null||pointerId===event.pointerId)){position(event);schedule();}};
  const drag=(event:PointerEvent)=>{if(pointerId!==event.pointerId)return;position(event);const r=element.getBoundingClientRect();target=!disabled()&&event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom?1:0;schedule();};
  const release=(completeTap=false)=>{if(dead)return;if(releaseTimer)win.clearTimeout(releaseTimer);releaseTimer=0;
    pointerId=null;keyboard=false;win.removeEventListener('pointermove',drag);
    const remaining=70-(win.performance.now()-pressedAt);
    if(completeTap&&target&&remaining>0&&!disabled())releaseTimer=win.setTimeout(()=>{releaseTimer=0;target=0;schedule();},remaining);
    else {target=0;schedule();}
  };
  const leave=()=>{hover=0;if(!keyboard)target=0;schedule();};
  const down=(event:PointerEvent)=>{if(disabled()||event.button!==0||pointerId!==null||origin(event)!==element||(event.target instanceof win.Element&&event.target.closest(':disabled,[aria-disabled="true"]')))return;
    if(releaseTimer)win.clearTimeout(releaseTimer);releaseTimer=0;pressedAt=win.performance.now();
    pointerId=event.pointerId;keyboard=false;position(event);target=1;spring.value=Math.max(spring.value,reducedMotion?1:.18);write();win.addEventListener('pointermove',drag,{passive:true});schedule();};
  const up=(event:PointerEvent)=>{if(pointerId===event.pointerId)release(true);};
  const cancel=(event:PointerEvent)=>{if(pointerId===event.pointerId)release();};
  const keyDown=(event:KeyboardEvent)=>{if(!disabled()&&!event.repeat&&origin(event)===element&&(event.key===' '||event.key==='Enter')){if(releaseTimer)win.clearTimeout(releaseTimer);releaseTimer=0;pressedAt=win.performance.now();keyboard=true;pointer=[.5,.5];target=1;spring.value=Math.max(spring.value,reducedMotion?1:.18);write();schedule();}};
  const keyUp=(event:KeyboardEvent)=>{if(keyboard&&(event.key===' '||event.key==='Enter'))release(true);};
  const focus=()=>{hover=1;schedule();};
  const blur=()=>{hover=0;release();};
  const visibility=()=>{if(element.ownerDocument.hidden){release();spring={value:0,velocity:0};field.emit(0,0,0);write();}};
  element.ownerDocument.addEventListener('visibilitychange',visibility);
  element.addEventListener('pointerenter',enter);element.addEventListener('pointerleave',leave);element.addEventListener('pointermove',move,{passive:true});element.addEventListener('pointerdown',down);
  element.addEventListener('keydown',keyDown);element.addEventListener('keyup',keyUp);element.addEventListener('focus',focus);element.addEventListener('blur',blur);
  win.addEventListener('pointerup',up);win.addEventListener('pointercancel',cancel);win.addEventListener('blur',blur);
  const observer=new win.MutationObserver(()=>{if(disabled())release();});observer.observe(element,{attributes:true,attributeFilter:['disabled','aria-disabled','hidden','inert']});
  const unsubscribe=observeGlassPreferences(win,p=>{reducedMotion=p.reducedMotion;highContrast=p.increasedContrast||p.forcedColors; schedule();});
  return {destroy(){if(dead)return;dead=true;if(releaseTimer)win.clearTimeout(releaseTimer);element.ownerDocument.removeEventListener('visibilitychange',visibility);if(frame)win.cancelAnimationFrame(frame);unsubscribe();observer.disconnect();field.destroy();boundElements.delete(element);
    element.removeEventListener('pointerenter',enter);element.removeEventListener('pointerleave',leave);element.removeEventListener('pointermove',move);element.removeEventListener('pointerdown',down);element.removeEventListener('keydown',keyDown);element.removeEventListener('keyup',keyUp);element.removeEventListener('focus',focus);element.removeEventListener('blur',blur);
    win.removeEventListener('pointermove',drag);win.removeEventListener('pointerup',up);win.removeEventListener('pointercancel',cancel);win.removeEventListener('blur',blur);
    for(const [name,value]of initial)if(element.style.getPropertyValue(name)===owned.get(name)){if(value)element.style.setProperty(name,value);else element.style.removeProperty(name);}
  }};
}
