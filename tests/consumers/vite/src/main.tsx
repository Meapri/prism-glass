import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@meapri/prism-glass/styles.css';
import {ControlsExample} from './recipes/ControlsExample';
import {ConfirmExample} from './recipes/ConfirmExample';
import {MediaDock} from './recipes/MediaDock';

createRoot(document.getElementById('root')!).render(<StrictMode><main style={{padding:24,fontFamily:'system-ui',display:'grid',gap:32}}>
  <h1>Installed package consumer</h1><ControlsExample/><ConfirmExample/><MediaDock src="/background.svg"/>
</main></StrictMode>);
