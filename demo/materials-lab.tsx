import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {GlassMediaScene,GlassSurface} from '../src/react.js';
import {glassSurfacePresets,resolveGlassSurface,type GlassSurfacePreset} from '../src/surface-presets.js';
const layouts:Record<GlassSurfacePreset,{width:number;height:number;left:string;top:string;transform:string}>={
  navigation:{width:360,height:54,left:'50%',top:'14%',transform:'translateX(-50%)'},
  toolbar:{width:240,height:52,left:'50%',top:'60%',transform:'translateX(-50%)'},
  'tab-bar':{width:340,height:66,left:'50%',top:'70%',transform:'translateX(-50%)'},
  search:{width:320,height:48,left:'50%',top:'16%',transform:'translateX(-50%)'},
  button:{width:126,height:44,left:'50%',top:'46%',transform:'translateX(-50%)'},
  'floating-action':{width:72,height:72,left:'70%',top:'60%',transform:'none'},
  selection:{width:118,height:38,left:'50%',top:'46%',transform:'translateX(-50%)'},
  menu:{width:228,height:184,left:'50%',top:'24%',transform:'translateX(-50%)'},
  popover:{width:270,height:166,left:'50%',top:'26%',transform:'translateX(-50%)'},
  sidebar:{width:194,height:286,left:'5%',top:'10%',transform:'none'},
  sheet:{width:360,height:244,left:'50%',top:'30%',transform:'translateX(-50%)'},
  media:{width:340,height:64,left:'50%',top:'70%',transform:'translateX(-50%)'},

  dock:{width:386,height:110,left:'50%',top:'55%',transform:'translateX(-50%)'},
  'dock-item':{width:68,height:68,left:'50%',top:'46%',transform:'translateX(-50%)'},
  alert:{width:320,height:172,left:'50%',top:'28%',transform:'translateX(-50%)'},
  'action-sheet':{width:240,height:236,left:'50%',top:'20%',transform:'translateX(-50%)'},
  notification:{width:360,height:90,left:'50%',top:'15%',transform:'translateX(-50%)'},
  chip:{width:104,height:36,left:'50%',top:'46%',transform:'translateX(-50%)'},
  widget:{width:158,height:158,left:'50%',top:'26%',transform:'translateX(-50%)'},
  control:{width:72,height:72,left:'50%',top:'45%',transform:'translateX(-50%)'},
  'live-activity':{width:340,height:104,left:'50%',top:'48%',transform:'translateX(-50%)'},
  'input-accessory':{width:320,height:48,left:'50%',top:'68%',transform:'translateX(-50%)'},
  'edit-menu':{width:240,height:44,left:'50%',top:'42%',transform:'translateX(-50%)'},
  'page-control':{width:144,height:28,left:'50%',top:'64%',transform:'translateX(-50%)'},

};
function SurfaceContent({preset}:{preset:GlassSurfacePreset}) {
  if(['dock','dock-item','control','widget','notification','live-activity','chip','input-accessory','edit-menu','page-control','alert','action-sheet'].includes(preset))return <span className="new-preset-label">{glassSurfacePresets[preset].label}</span>;
  if(preset==='search')return <span className="sample-search">⌕ <span>Search your collection</span></span>;
  if(preset==='navigation')return <div className="sample-nav"><span>‹</span><strong>Collection</strong><span>•••</span></div>;
  if(preset==='toolbar')return <div className="sample-nav"><span>↶</span><span>＋</span><span>♡</span><span>↗</span></div>;
  if(preset==='tab-bar')return <div className="sample-nav"><strong>Library</strong><span>Explore</span><span>Saved</span></div>;
  if(preset==='floating-action')return <span style={{fontSize:32,fontWeight:300}}>＋</span>;
  if(preset==='button'||preset==='selection')return <strong>{preset==='button'?'Continue':'Selected'}</strong>;
  if(preset==='media')return <div className="sample-nav"><span>▶</span><span>Now playing</span><span>•••</span></div>;
  if(preset==='menu')return <div className="sample-menu"><strong>Actions</strong><span>Save to collection <span>＋</span></span><span>Share this item <span>↗</span></span><span>View details <span>›</span></span></div>;
  if(preset==='sidebar')return <div className="sample-menu"><strong>Your workspace</strong><span>Overview</span><span>Recent files</span><span>Collections</span><span>Shared with you</span><small>Everything in its place.</small></div>;
  return <div className="sample-panel"><small>{preset==='sheet'?'COLLECTION':'QUICK LOOK'}</small><h4>A little more space.</h4><p>Soft light. Clear information.<br/>A surface that stays easy to read.</p><button type="button" className="sample-action" onClick={e=>{e.currentTarget.textContent='Saved';}}>Save changes</button></div>;
}
export function MaterialsLab(){
  const [preset,setPreset]=useState<GlassSurfacePreset>('navigation'),[background,setBackground]=useState('split'),[mode,setMode]=useState<'adaptive'|'light'|'dark'>('adaptive');
  const source=useRef<HTMLCanvasElement>(null),[move,setMove]=useState(0),[sceneWidth,setSceneWidth]=useState(640);
  useEffect(()=>{const observer=new ResizeObserver(entries=>setSceneWidth(entries[0].contentRect.width));observer.observe(source.current!);return()=>observer.disconnect();},[]);
  const options={live:background==='moving'};
  useEffect(()=>{
    const canvas=source.current!,ctx=canvas.getContext('2d')!;let frame=0;
    function draw(time=0){ctx.clearRect(0,0,960,640);
      if(background==='light'||background==='dark'){ctx.fillStyle=background==='light'?'#f4f1e9':'#171923';ctx.fillRect(0,0,960,640);}
      else if(background==='split'){ctx.fillStyle='#f4f1e9';ctx.fillRect(0,0,480,640);ctx.fillStyle='#171923';ctx.fillRect(480,0,480,640);}
      else {const offset=background==='moving'?Math.sin(time/2200)*.5+.5:.5;const gradient=ctx.createLinearGradient(-600+offset*1300,0,600+offset*1300,640);gradient.addColorStop(0,'#fcf1dc');gradient.addColorStop(.5,'#647ea4');gradient.addColorStop(1,'#0c1020');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,640);}
      ctx.font='600 25px -apple-system, sans-serif';ctx.fillStyle=background==='dark'?'#e5e8f060':'#66708260';ctx.fillText('FIELD NOTES / 027',55,60);
      ctx.font='16px -apple-system, sans-serif';
      for(let i=0;i<11;i++){ctx.fillStyle=background==='dark'?'#b5c5d82a':'#8994a435';ctx.fillRect(55,130+i*37,250+(i%3)*35,8);ctx.fillRect(565,130+i*37,260-(i%4)*25,8);}
      if(background==='busy'){for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#e2bda299':'#3f5075aa';ctx.fillRect((i*73)%960,(i*113)%640,82,50);}}
      if(background==='moving')frame=requestAnimationFrame(draw);
    }draw();return()=>cancelAnimationFrame(frame);
  },[background]);
  const profile=glassSurfacePresets[preset],layout=layouts[preset],resolved=resolveGlassSurface(preset,layout);
  const visualWidth=Math.min(layout.width,sceneWidth*.9),start=parseFloat(layout.left)/100*sceneWidth-(layout.transform==='none'?0:visualWidth/2);
  const x=Math.max(12,Math.min(sceneWidth-visualWidth-12,start+move));
  return <section className="materials-lab" id="materials" aria-label="Material presets">
    <div className="section-title"><h2>One material. Many purposes.</h2><p>Explore shape, depth, and content-aware appearance.</p></div>
    <div className="materials-workbench">
      <div className="preset-list" role="group" aria-label="Surface presets">{Object.entries(glassSurfacePresets).map(([key,p])=><button key={key} type="button" aria-pressed={key===preset} onClick={()=>setPreset(key as GlassSurfacePreset)}>{p.label}</button>)}</div>
      <div className="preset-preview">
        <GlassMediaScene source={source} sourceVersion={background} variant={profile.variant} appearance={mode} media={options} className="preset-scene" aria-label="Preset preview">
          <canvas ref={source} width={960} height={640} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
          <div className="prism-media-controls"><GlassSurface key={preset} preset={preset} className="preset-glass" data-testid="preset-glass" style={{position:'absolute',...layout,left:x,transform:'none',maxWidth:'90%',padding:['button','selection','floating-action'].includes(preset)?0:18} as CSSProperties}><SurfaceContent preset={preset}/></GlassSurface></div>
        </GlassMediaScene>
        <div className="preview-options"><label>Backdrop <select aria-label="Preset backdrop" value={background} onChange={e=>setBackground(e.target.value)}><option value="split">Light / dark</option><option value="light">Light</option><option value="dark">Dark</option><option value="busy">Detailed</option><option value="moving">Moving light</option></select></label><label>Appearance <select aria-label="Preset appearance" value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="adaptive">Adaptive</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Position <input aria-label="Glass position" type="range" min={-110} max={110} value={move} onChange={e=>setMove(e.target.valueAsNumber)}/></label></div>
        <div className="preset-description"><h3>{profile.label}</h3><p>{profile.description}</p><code>{`<GlassSurface preset="${preset}" appearance="adaptive" />`}</code><dl><div><dt>Curvature</dt><dd>{resolved.optics.curvature}</dd></div><div><dt>Refraction</dt><dd>{resolved.optics.strength!.toFixed(1)} px</dd></div><div><dt>Diffusion</dt><dd>{resolved.material.blur.toFixed(1)} px</dd></div><div><dt>Adaptation</dt><dd>{profile.variant==='clear'?'Clear · static':profile.adaptation==='ambient'?'Stable labels':'Light ↔ dark'}</dd></div></dl></div>
      </div>
    </div>
    <DomBackdropExample/>
  </section>;
}
function DomBackdropExample(){const [dark,setDark]=useState(false);return <div className="dom-example"><div><h3>On your page, too.</h3><p>Scroll the content beneath the floating bar, or change the page background.</p><button type="button" onClick={()=>setDark(!dark)}>Change page background</button></div><div className="dom-scroll" data-dark={dark}><div className="dom-bar"><GlassSurface preset="navigation" appearance="adaptive" data-testid="dom-adaptive"><div className="sample-nav"><strong>Reading list</strong><span>•••</span></div></GlassSurface></div><div className="dom-chapters"><article><small>CHAPTER ONE</small><h4>Room to focus.</h4><p>A floating surface can follow the content beneath it. This example uses ordinary page content.</p></article><article><small>CHAPTER TWO</small><h4>A different atmosphere.</h4><p>As the background changes, the foreground stays legible.</p></article></div></div></div>}
