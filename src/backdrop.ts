import {summarizeBackdrop, type GlassBackdropSample} from './adaptive.js';
import {clamp} from './optics.js';
import type {GlassMediaSource} from './media-types.js';
export type GlassBackdropReader = () => GlassBackdropSample | null;
export interface GlassBackdropOptions { source?:Element; sample?:GlassBackdropReader }
type Color = [number,number,number,number];
const split=(text:string)=>text.split(/,(?![^()]*\))/).map(s=>s.trim());
const over=(front:Color,back:Color):Color=>{const a=front[3]+back[3]*(1-front[3]);return a?[(front[0]*front[3]+back[0]*back[3]*(1-front[3]))/a,(front[1]*front[3]+back[1]*back[3]*(1-front[3]))/a,(front[2]*front[3]+back[2]*back[3]*(1-front[3]))/a,a]:[0,0,0,0];};
export function mediaSourceRect(width:number,height:number,sourceWidth:number,sourceHeight:number,fit:'cover'|'contain'|'fill',position:readonly[number,number]):[number,number,number,number] {
  const scale=fit==='cover'?Math.max(width/sourceWidth,height/sourceHeight):Math.min(width/sourceWidth,height/sourceHeight);
  const w=fit==='fill'?width:sourceWidth*scale,h=fit==='fill'?height:sourceHeight*scale;
  return [(width-w)*position[0],(height-h)*position[1],w,h];
}
/** One bounded CPU surface per sampler; no WebGL readback and no network requests. */
export function createBackdropSampler(doc:Document) {
  const canvas=doc.createElement('canvas');canvas.width=canvas.height=64;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const colorCanvas=doc.createElement('canvas');colorCanvas.width=colorCanvas.height=1;
  const colorContext=colorCanvas.getContext('2d',{willReadFrequently:true});
  let frames=new WeakMap<Element,{data:Uint8ClampedArray;width:number;height:number}|null>();
  let styles=new WeakMap<Element,CSSStyleDeclaration>();
  const colors=new Map<string,Color|null>();
  function color(value:string):Color|null {
    if(colors.has(value))return colors.get(value)!;
    if(!colorContext)return null;
    colorContext.fillStyle='#010203';colorContext.fillStyle=value;
    const first=colorContext.fillStyle;colorContext.fillStyle='#040506';colorContext.fillStyle=value;
    if(first!==colorContext.fillStyle)return null;
    colorContext.clearRect(0,0,1,1);colorContext.fillRect(0,0,1,1);
    const d=colorContext.getImageData(0,0,1,1).data;const result:Color=[d[0]/255,d[1]/255,d[2]/255,d[3]/255];
    if(colors.size>256)colors.clear();colors.set(value,result);return result;
  }
  function pixels(source:GlassMediaSource) {
    if(frames.has(source))return frames.get(source)!;
    let result:null|{data:Uint8ClampedArray;width:number;height:number}=null;
    try {
      const video=source as HTMLVideoElement,img=source as HTMLImageElement;
      const width=source.tagName==='VIDEO'?video.videoWidth:source.tagName==='IMG'?img.naturalWidth:(source as HTMLCanvasElement).width;
      const height=source.tagName==='VIDEO'?video.videoHeight:source.tagName==='IMG'?img.naturalHeight:(source as HTMLCanvasElement).height;
      if(context&&width>0&&height>0&&(source.tagName!=='VIDEO'||video.readyState>=2)) {
        // Reset removes a previous cross-origin taint when a source is replaced.
        canvas.width=64;context.clearRect(0,0,64,64);context.drawImage(source,0,0,64,64);
        result={data:context.getImageData(0,0,64,64).data,width,height};
      }
    } catch { /* CORS/DRM/unready sources are explicitly unavailable. */ }
    frames.set(source,result);return result;
  }
  function pixel(source:GlassMediaSource,x:number,y:number,rect:readonly number[]):Color|null {
    const frame=pixels(source);if(!frame)return null;
    const u=(x-rect[0])/rect[2],v=(y-rect[1])/rect[3];
    if(u<0||v<0||u>1||v>1)return [0,0,0,0];
    const index=(Math.min(63,Math.floor(v*64))*64+Math.min(63,Math.floor(u*64)))*4,d=frame.data;
    return [d[index]/255,d[index+1]/255,d[index+2]/255,d[index+3]/255];
  }
  function gradient(image:string,x:number,y:number,w:number,h:number):Color|null {
    const match=/^(linear|radial)-gradient\((.*)\)$/.exec(image);if(!match)return null;
    const parts=split(match[2]);let direction=parts[0],angle=180,radial=match[1]==='radial';
    if(!color(direction)) {
      parts.shift();
      if(radial&&direction!=='ellipse'&&direction!=='circle')return null;
      if(!radial){const dirs:Record<string,number>={'to top':0,'to right':90,'to bottom':180,'to left':270,'to top right':45,'to bottom right':135,'to bottom left':225,'to top left':315};
        if(direction in dirs)angle=dirs[direction];else if(/^-?[\d.]+deg$/.test(direction))angle=parseFloat(direction);else return null;}
    }
    const stops=parts.map(part=>{let c=color(part),at:number|undefined;if(!c){const m=/^(.*)\s+(-?[\d.]+)%$/.exec(part);if(m){c=color(m[1]);at=parseFloat(m[2])/100;}}return {c,at};});
    if(stops.length<2||stops.some(s=>!s.c))return null;
    stops[0].at??=0;stops[stops.length-1].at??=1;
    for(let i=1;i<stops.length;i++)if(stops[i].at!=null)stops[i].at=Math.max(stops[i-1].at??0,stops[i].at!);
    for(let i=1;i<stops.length-1;i++)if(stops[i].at==null){let end=i+1;while(stops[end].at==null)end++;const start=stops[i-1].at!;for(let j=i;j<end;j++)stops[j].at=start+(stops[end].at!-start)*(j-i+1)/(end-i+1);i=end-1;}
    const radians=angle*Math.PI/180,dx=Math.sin(radians),dy=-Math.cos(radians);
    const t=radial?Math.hypot((x-w/2)/(direction==='circle'?Math.hypot(w,h)/2:w/Math.SQRT2),(y-h/2)/(direction==='circle'?Math.hypot(w,h)/2:h/Math.SQRT2)):.5+((x-w/2)*dx+(y-h/2)*dy)/(Math.abs(w*dx)+Math.abs(h*dy));
    let a=stops[0],b=stops[stops.length-1];for(let i=1;i<stops.length;i++)if(t<=stops[i].at!){a=stops[i-1];b=stops[i];break;}
    const amount=clamp((t-a.at!)/Math.max(.00001,b.at!-a.at!),0,1);
    // Interpolate premultiplied channels so transparent stops don't become black halos.
    const alpha=a.c![3]*(1-amount)+b.c![3]*amount;
    return [...[0,1,2].map(i=>alpha?(a.c![i]*a.c![3]*(1-amount)+b.c![i]*b.c![3]*amount)/alpha:0),alpha] as Color;
  }
  function layer(node:Element,x:number,y:number):Color|null {
    let style=styles.get(node);if(!style){style=doc.defaultView!.getComputedStyle(node);styles.set(node,style);}
    const rect=node.getBoundingClientRect();let result=color(style.backgroundColor)??[0,0,0,0] as Color;
    if(style.backgroundImage!=='none'){
      const g=gradient(style.backgroundImage,x-rect.left,y-rect.top,rect.width,rect.height);if(!g)return null;
      result=over(g,result);
    }
    if(['IMG','VIDEO','CANVAS'].includes(node.tagName)) {
      const media=node as GlassMediaSource,frame=pixels(media);if(!frame)return null;
      const positions=style.objectPosition.split(' ').map(v=>v.endsWith('%')?parseFloat(v)/100:NaN);
      if(positions.length!==2||positions.some(v=>!Number.isFinite(v)))return null;
      const fit=style.objectFit;if(!['cover','contain','fill'].includes(fit))return null;
      const c=pixel(media,x-rect.left,y-rect.top,mediaSourceRect(rect.width,rect.height,frame.width,frame.height,fit as 'cover'|'contain'|'fill',positions as [number,number]));
      if(!c)return null;result=over(c,result);
    }
    result=[...result.slice(0,3),result[3]*Number(style.opacity)] as Color;
    return result;
  }
  const points=(r:{x:number;y:number;width:number;height:number})=>{const result:[number,number][]=[];for(const u of [.2,.5,.8])for(const v of [.2,.5,.8])result.push([r.x+r.width*u,r.y+r.height*v]);return result;};
  return {
    begin(){frames=new WeakMap();styles=new WeakMap();},
    media(source:GlassMediaSource,lens:{x:number;y:number;width:number;height:number},sourceRect:readonly number[],background:readonly [number,number,number]):GlassBackdropSample|null {
      const samples:Color[]=[];for(const [x,y] of points(lens)){const c=pixel(source,x,y,sourceRect);if(!c)return null;samples.push(over(c,[...background,1]));}
      return summarizeBackdrop(samples,'pixels');
    },
    dom(element:HTMLElement,source?:Element):GlassBackdropSample|null {
      const r=element.getBoundingClientRect();if(!r.width||!r.height)return null;const samples:Color[]=[];
      for(const [x,y] of points(r)){
        if(x<0||y<0||x>=doc.defaultView!.innerWidth||y>=doc.defaultView!.innerHeight)continue;
        let layers:Element[];
        if(source){layers=[];for(let node:Element|null=source;node;node=node.parentElement)layers.push(node);}
        else {const stack=doc.elementsFromPoint(x,y),index=stack.reduce((last,node,i)=>node===element||element.contains(node)?i:last,-1);
          // Never include foreground occluders in the inferred backdrop.
          if(index<0)continue;layers=stack.slice(index+1).filter(node=>!node.closest('.prism-material'));}
        let combined:Color=[0,0,0,0],unknown=false;
        for(const node of layers){const c=layer(node,x,y);if(!c){unknown=true;break;}combined=over(combined,c);if(combined[3]>.995)break;}
        if(!unknown&&combined[3]>.995)samples.push(combined);
      }
      return samples.length>=4?summarizeBackdrop(samples,'css',samples.length/9):null;
    },
    destroy(){canvas.width=canvas.height=colorCanvas.width=colorCanvas.height=1;frames=new WeakMap();colors.clear();},
  };
}
interface Subscriber {element:HTMLElement;callback:(sample:GlassBackdropSample|null)=>void;options:GlassBackdropOptions}
const stores=new WeakMap<Window,{add(sub:Subscriber):()=>void;refresh():void}>();
/** Shared bounded polling covers scroll, CSS animation, image load and stationary content changes. */
export function observeGlassBackdrop(element:HTMLElement,callback:Subscriber['callback'],options:GlassBackdropOptions={}) {
  const win=element.ownerDocument.defaultView;if(!win)throw new Error('Backdrop observation requires a window');
  let store=stores.get(win);
  if(!store){const subscribers=new Set<Subscriber>(),sampler=createBackdropSampler(element.ownerDocument);let frame=0,timer=0,pending=0,last=-Infinity;
    const refresh=()=>{if(frame||win.document.hidden)return;const remaining=120-(win.performance.now()-last);if(remaining>0){if(!pending)pending=win.setTimeout(()=>{pending=0;refresh();},remaining);return;}frame=win.requestAnimationFrame(()=>{frame=0;last=win.performance.now();sampler.begin();const results:[Subscriber,GlassBackdropSample|null][]=[];for(const sub of subscribers){const r=sub.element.getBoundingClientRect();if(!sub.element.isConnected||!r.width||!r.height||r.bottom<0||r.top>win.innerHeight||r.right<0||r.left>win.innerWidth)continue;let sample=null;try{sample=sub.options.sample?sub.options.sample():sampler.dom(sub.element,sub.options.source);}catch{}results.push([sub,sample]);}for(const [sub,sample] of results)sub.callback(sample);});};
    store={refresh,add(sub){if(!subscribers.size){win.addEventListener('scroll',refresh,true);win.addEventListener('resize',refresh);win.document.addEventListener('visibilitychange',refresh);timer=win.setInterval(refresh,160);}subscribers.add(sub);refresh();return()=>{subscribers.delete(sub);if(!subscribers.size){win.clearInterval(timer);if(pending)win.clearTimeout(pending);if(frame)win.cancelAnimationFrame(frame);win.removeEventListener('scroll',refresh,true);win.removeEventListener('resize',refresh);win.document.removeEventListener('visibilitychange',refresh);sampler.destroy();stores.delete(win);}};}};stores.set(win,store);
  }
  const stop=store.add({element,callback,options});return {refresh:store.refresh,destroy:stop};
}
