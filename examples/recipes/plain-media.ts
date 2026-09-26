import {createMediaGlass} from '@meapri/prism-glass/media';

/** Host: position:relative and explicit dimensions. Image: width/height:100%, object-fit:cover. */
export async function mountMediaLens(host:HTMLElement,source:HTMLImageElement){
  await source.decode();
  if(!host.isConnected||!host.contains(source))throw new Error('Mount the source in its host first');
  const canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
  host.append(canvas);
  try{
    const renderer=createMediaGlass(canvas,source,{
      fit:'cover',
      lenses:[{id:'control',variant:'clear',dimming:0,tint:[1,1,1,.035],
        lens:{x:24,y:24,width:160,height:56,radius:28,shape:'capsule'}}],
    });
    return {renderer,destroy(){renderer.destroy();canvas.remove();}};
  }catch(error){canvas.remove();throw error;}
}
