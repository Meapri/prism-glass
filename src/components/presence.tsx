import {forwardRef,useEffect,useRef,useState,type HTMLAttributes} from 'react';
import {GlassSurface,type GlassSurfaceProps} from './surface.js';
/** Keep the surface mounted through its optical exit, then release it. */
export const GlassPresence=forwardRef<HTMLDivElement,GlassSurfaceProps & {present:boolean}>(function GlassPresence({present,onPresenceChange,...props},ref){
  const [mounted,setMounted]=useState(present),latest=useRef(present);latest.current=present;
  useEffect(()=>{if(present)setMounted(true);},[present]);
  if(!mounted&&!present)return null;
  return <GlassSurface {...props} ref={ref} present={present} onPresenceChange={phase=>{onPresenceChange?.(phase);if(phase==='hidden'&&!latest.current)setMounted(false);}}/>;
});
/** Limits the optical response between neighboring surfaces; it does not merge their geometry. */
export function GlassLightGroup(props:HTMLAttributes<HTMLDivElement>){return <div {...props} data-prism-light-group=""/>;}
