'use client';

import {useRef,useState} from 'react';
import {GlassAlertDialog,GlassButton} from '@meapri/prism-glass/react';

export function ConfirmExample(){
  const trigger=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false);
  const [removed,setRemoved]=useState(false);
  return <section aria-label="Confirmation example">
    <p>{removed?'Item removed':'One saved item'}</p>
    <GlassButton ref={trigger} onClick={()=>setOpen(true)}>Review removal</GlassButton>
    <GlassAlertDialog open={open} onOpenChange={setOpen} returnFocusRef={trigger}
      title="Remove saved item?" message="Confirm before changing your collection."
      actions={[
        {label:'Cancel',intent:'cancel'},
        {label:'Remove',intent:'destructive',onSelect:()=>setRemoved(true)},
      ]}/>
  </section>;
}
