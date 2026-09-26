'use client';

import {useState} from 'react';
import {GlassButton,GlassMenu,GlassProvider,GlassSlider,GlassSwitch} from '@meapri/prism-glass/react';

export function ControlsExample(){
  const [count,setCount]=useState(0);
  const [enabled,setEnabled]=useState(true);
  const [volume,setVolume]=useState(40);
  const [action,setAction]=useState('No action yet');
  return <GlassProvider variant="regular" appearance="auto">
    <section aria-label="Example controls" style={{display:'grid',gap:20,justifyItems:'start'}}>
      <GlassButton onClick={()=>setCount(count+1)}>Add item</GlassButton>
      <output aria-label="Item count">{count} items</output>
      <label style={{display:'flex',alignItems:'center',gap:16}}>
        Notifications
        <GlassSwitch aria-label="Notifications" checked={enabled} onCheckedChange={setEnabled}/>
      </label>
      <GlassSlider aria-label="Volume" value={volume} onValueChange={setVolume} min={0} max={100}/>
      <output aria-label="Volume value">{volume}%</output>
      <GlassMenu trigger="Actions" aria-label="Example actions" items={[
        {id:'save',label:'Save',onSelect:()=>setAction('Saved')},
        {id:'reset',label:'Reset count',onSelect:()=>{setCount(0);setAction('Count reset');}},
      ]}/>
      <p role="status">{action}</p>
    </section>
  </GlassProvider>;
}
