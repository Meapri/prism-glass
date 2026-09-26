'use client';

import {useRef,useState} from 'react';
import {GlassDock,GlassDockItem,GlassMediaScene} from '@meapri/prism-glass/react';

export function MediaDock({src}:{src:string}){
  const image=useRef<HTMLImageElement>(null);
  const [selected,setSelected]=useState('Home');
  return <section aria-label="Image dock example">
    <GlassMediaScene source={image} variant="clear" dimming={0} tint={[1,1,1,.035]}
      style={{width:'100%',maxWidth:620,height:260,borderRadius:24}}>
      <img ref={image} src={src} alt=""/>
      <div className="prism-media-controls" style={{display:'grid',placeItems:'center',padding:16}}>
        <GlassDock aria-label="Example dock">
          <GlassDockItem label="Home" onClick={()=>setSelected('Home')}><span aria-hidden="true">⌂</span></GlassDockItem>
          <GlassDockItem label="Search" onClick={()=>setSelected('Search')}><span aria-hidden="true">⌕</span></GlassDockItem>
          <GlassDockItem label="Saved" onClick={()=>setSelected('Saved')}><span aria-hidden="true">♡</span></GlassDockItem>
          <GlassDockItem label="More" onClick={()=>setSelected('More')}><span aria-hidden="true">···</span></GlassDockItem>
        </GlassDock>
      </div>
    </GlassMediaScene>
    <output aria-label="Dock selection">{selected}</output>
  </section>;
}
