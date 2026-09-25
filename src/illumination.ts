import {clamp} from './optics.js';
export interface GlassLightSample { energy:number; point:readonly[number,number] }
type Receiver=(sample:GlassLightSample)=>void;
interface LightSource {energy:number;x:number;y:number;scope:Element|null}
const fields=new WeakMap<Window,{add(element:HTMLElement,receive:Receiver):{emit(energy:number,x:number,y:number):void;destroy():void}}>();
/** A document shares one propagation pass; light only crosses an explicit/structural group. */
export function joinGlassLightField(element:HTMLElement,receive:Receiver) {
  const win=element.ownerDocument.defaultView!;
  let field=fields.get(win);
  if(!field){
    const receivers=new Map<HTMLElement,{receive:Receiver;last:string}>(),sources=new Map<HTMLElement,LightSource>();let frame=0;
    const scope=(node:HTMLElement)=>node.closest('[data-prism-light-group]')??node.closest('.prism-media-scene')??node.parentElement;
    const schedule=()=>{if(!frame)frame=win.requestAnimationFrame(()=>{frame=0;
      const updates:Array<[Receiver,GlassLightSample]>=[];
      const rectangles=new Map([...receivers.keys()].map(node=>[node,node.getBoundingClientRect()]));
      for(const [node,entry]of receivers){const r=rectangles.get(node)!;let energy=0,point:readonly[number,number]=[.5,.5];
        if(r.width&&r.height&&node.isConnected&&!node.hidden&&!node.inert)for(const [origin,source]of sources){
          if(origin===node||source.scope!==scope(node)||origin.contains(node)||node.contains(origin))continue;
          const x=clamp(source.x,r.left,r.right),y=clamp(source.y,r.top,r.bottom),distance=Math.hypot(x-source.x,y-source.y);
          const sourceRect=rectangles.get(origin)!;
          const gap=Math.hypot(Math.max(0,r.left-sourceRect.right,sourceRect.left-r.right),Math.max(0,r.top-sourceRect.bottom,sourceRect.top-r.bottom));
          const value=source.energy*.32*Math.pow(Math.max(0,1-gap/160),2)*(.25+.75*Math.exp(-distance/90));
          if(value>energy){energy=value;point=[clamp((source.x-r.left)/r.width,0,1),clamp((source.y-r.top)/r.height,0,1)];}
        }
        const key=[energy.toFixed(3),...point.map(v=>v.toFixed(3))].join(':');if(key!==entry.last){entry.last=key;updates.push([entry.receive,{energy,point}]);}
      }
      for(const [callback,sample]of updates)callback(sample);
    });};
    field={add(node,callback){receivers.set(node,{receive:callback,last:''});schedule();return {
      emit(energy,x,y){if(energy>.001)sources.set(node,{energy,x,y,scope:scope(node)});else sources.delete(node);schedule();},
      destroy(){receivers.delete(node);sources.delete(node);if(!receivers.size){if(frame)win.cancelAnimationFrame(frame);fields.delete(win);}else schedule();},
    };}};fields.set(win,field);
  }
  return field.add(element,receive);
}
/** SDR screen-like lifting: a small bright core, soft bloom and a broad internal fill. */
export function glassLightAt(x:number,y:number,width:number,height:number,energy:number,point:readonly[number,number]) {
  const dx=x-point[0]*width,dy=y-point[1]*height,d2=dx*dx+dy*dy;
  const spread=24+Math.min(110,Math.hypot(width,height)*.45)*Math.sqrt(clamp(energy,0,1));
  return clamp(1-(1-energy*.48*Math.exp(-d2/(18*18)))*(1-energy*.33*Math.exp(-d2/(spread*spread)))*(1-energy*.09),0,.92);
}
