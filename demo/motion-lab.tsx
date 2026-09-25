import {useRef,useState} from 'react';
import {GlassButton,GlassLightGroup,GlassMediaScene,GlassPresence,GlassPopover} from '../src/react.js';
import type {GlassPresencePhase} from '../src/presence.js';
import flowerStill from './assets/flower-still.webp';
export function MotionLab(){
  const toggleButton=useRef<HTMLButtonElement>(null),picture=useRef<HTMLImageElement>(null),[visible,setVisible]=useState(true),[phase,setPhase]=useState<GlassPresencePhase>('entering'),[saved,setSaved]=useState(0),[material,setMaterial]=useState<'clear'|'regular'>('clear'),[dimming,setDimming]=useState(0);
  return <section id="motion" className="motion-lab" aria-label="Glass light and motion">
    <div className="section-title"><h2>Light follows your touch.</h2><p>Press, hold, and move. Then watch the material form.</p></div>
    <GlassMediaScene className="motion-scene" source={picture} variant={material} dimming={dimming} tint={material==='clear'?[1,1,1,.045]:undefined} appearance="dark" aria-label="Interaction preview">
      <img ref={picture} src={flowerStill} alt="Still flower backdrop"/>
      <GlassLightGroup className="prism-media-controls">
        <div className="motion-actions"><GlassButton variant={material} preset="button" onClick={()=>setSaved(n=>n+1)}>Save</GlassButton><GlassButton variant={material} preset="button" onClick={()=>setSaved(n=>n+1)}>Share</GlassButton><GlassButton variant={material} preset="button" onClick={()=>setSaved(n=>n+1)}>More</GlassButton></div>
        <GlassPresence present={visible} variant={material} preset="popover" className="motion-panel" onPresenceChange={setPhase} data-testid="motion-panel">
          <h3>Liquid Glass</h3><p>Light gathers. The surface takes shape.</p><button className="motion-close" type="button" onClick={()=>{setVisible(false);toggleButton.current?.focus();}}>Close surface</button>
        </GlassPresence>
      </GlassLightGroup>
    </GlassMediaScene>
    <div className="motion-caption"><label>Material <select aria-label="Motion material" value={material} onChange={e=>setMaterial(e.target.value as typeof material)}><option value="clear">Clear</option><option value="regular">Regular</option></select></label><label>Background dimming <input aria-label="Motion background dimming" type="range" min="0" max="0.35" step="0.05" disabled={material!=='clear'} value={dimming} onChange={e=>setDimming(e.currentTarget.valueAsNumber)}/><output>{Math.round(dimming*100)}%</output></label><GlassButton ref={toggleButton} onClick={()=>setVisible(v=>!v)}>{visible?'Hide glass':'Show glass'}</GlassButton><span role="status" id="presence-status">{{hidden:'Surface hidden',entering:'Materializing',shown:'Surface ready',exiting:'Dematerializing'}[phase]}</span><span>{saved?`${saved} actions activated`:'Nearby glass catches a little of the light.'}</span><GlassPopover trigger="Try a popover" aria-label="Motion popover"><h4>A native popover.</h4><p>Its material forms on open and releases on close.</p><button type="button" className="sample-action" onClick={e=>e.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover()}>Done</button></GlassPopover></div>
  </section>;
}
