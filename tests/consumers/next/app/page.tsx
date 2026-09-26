// Intentionally a Server Component importing the actual packaged React entry.
import {GlassButton} from '@meapri/prism-glass/react';
import {getGlassMaterial} from '@meapri/prism-glass';
import {ControlsExample} from './recipes/ControlsExample';
import {ConfirmExample} from './recipes/ConfirmExample';
import {MediaDock} from './recipes/MediaDock';

export default function Page(){
  const material=getGlassMaterial('regular');
  return <main style={{padding:24,display:'grid',gap:32}}>
    <h1>Installed package consumer</h1>
    <GlassButton>Server-composed button</GlassButton>
    <p>Server material: {material.variant}</p>
    <ControlsExample/><ConfirmExample/><MediaDock src="/background.svg"/>
  </main>;
}
