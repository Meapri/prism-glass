import {createRoot} from 'react-dom/client';
import {useRef} from 'react';
import {GlassMediaScene,GlassSurface,GlassButton,GlassSwitch,GlassSlider,GlassTabs} from '../../src/react.js';
const dark = new URLSearchParams(location.search).has('dark');
const panels = [
  {x:57,y:126.667,w:130,h:48,shape:'capsule',variant:'regular',text:'Regular',weight:500},
  {x:215,y:126.667,w:130,h:48,shape:'capsule',variant:'clear',text:'Clear',weight:500},
  {x:79,y:208.667,w:104,h:104,shape:'circle',variant:'regular'},
  {x:219,y:208.667,w:104,h:104,shape:'circle',variant:'clear'},
  {x:39,y:346.667,w:324,h:104,shape:'rounded-rect',variant:'regular',text:'Regular material\nNative diffusion and edge lighting',weight:400},
  {x:39,y:484.667,w:324,h:64,shape:'capsule',variant:'clear',text:'Clear material',weight:600},
] as const;
function App(){const source=useRef<HTMLImageElement>(null);return <>
<header><span>Native iOS 27</span><span>Prism Glass · {dark?'Dark':'Light'} <a href={dark?'?':'?dark'}>Switch appearance</a></span></header>
<main><img className="reference" src={dark?'NATIVE_DARK':'NATIVE_LIGHT'} alt="Native SwiftUI material reference"/>
<GlassMediaScene source={source} appearance={dark?'dark':'light'} media={{pixelRatio:2}} style={{width:402,height:675,borderRadius:0}}>
<img ref={source} src="BACKGROUND" alt="Identical flower frame"/>
<div className="prism-media-controls">{panels.map((p,i)=><GlassSurface key={i} shape={p.shape} variant={p.variant} radius={28} style={{position:'absolute',left:p.x,top:p.y,width:p.w,height:p.h,padding:0,display:'grid',placeItems:'center',fontSize:17,lineHeight:'22px',fontWeight:'weight' in p?p.weight:500,textAlign:'center',whiteSpace:'pre-line'}}>{'text' in p?p.text:<svg width="20" height="27" viewBox="0 0 20 27" fill="currentColor"><rect width="8" height="27" rx="2"/><rect x="12" width="8" height="27" rx="2"/></svg>}</GlassSurface>)}</div>
</GlassMediaScene></main><section className="control-comparison"><img src="NATIVE_CONTROLS" alt="Native controls, normalized focused crops"/><div className="control-samples"><GlassButton style={{position:'absolute',left:26,top:2}}>Done</GlassButton><GlassSwitch aria-label="Reference notifications" defaultChecked style={{position:'absolute',left:294,top:0}}/><GlassSlider aria-label="Reference volume" style={{position:'absolute',left:14,top:60,width:374}}/><div style={{position:'absolute',left:32,top:120,width:338}}><GlassTabs aria-label="Reference selection" items={[{value:'first',label:'First'},{value:'second',label:'Second'},{value:'third',label:'Third'}]}/></div></div></section></>}
createRoot(document.getElementById('root')!).render(<App/>);
