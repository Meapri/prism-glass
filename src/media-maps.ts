import {clamp,finite,normalizeLens,roundedDistance,type OpticalShape} from './optics.js';

export interface MediaPixelMaps {width:number;height:number;precision:16;displacement:Uint8Array;finish:Uint8Array}
/** RG = signed X in 16 bits, BA = signed Y in 16 bits. Linear filtering remains linear after decoding. */
export function generateMediaMaps(input:OpticalShape,resolution=1024,pixelRatio=2):MediaPixelMaps {
  const lens=normalizeLens({...input,x:0,y:0});
  const depth=input.depth??1,curvature=input.curvature??4;
  for(const [name,value] of Object.entries({resolution,pixelRatio,bevel:input.bevel,ior:input.ior,depth,curvature}))finite(value,name);
  if(pixelRatio<=0||input.bevel<=0||input.ior<1||input.ior>3||depth<0||depth>4||curvature<2||curvature>8)throw new RangeError('Invalid optical field');
  if(!['rim','dome','concave'].includes(input.surface??'rim')||!['uniform','center','edge'].includes(input.blurMode??'uniform'))throw new TypeError('Invalid optical material');
  const shape={...input,...lens,depth,curvature,bevel:Math.min(input.bevel,lens.width/2,lens.height/2)};
  const limit=clamp(Math.round(resolution),32,2048),scale=Math.min(pixelRatio,limit/Math.max(lens.width,lens.height));
  const width=Math.max(2,Math.round(lens.width*scale)),height=Math.max(2,Math.round(lens.height*scale));
  const displacement=new Uint8Array(width*height*4),finish=new Uint8Array(width*height*4),sign=shape.surface==='concave'?-1:1;
  const smooth=(v:number)=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  for(let y=0;y<Math.ceil(height/2);y++)for(let x=0;x<Math.ceil(width/2);x++){
    const px=(x+.5)*lens.width/width,py=(y+.5)*lens.height/height;
    const sample=normalAt(px,py,shape),d=sample.d;
    const bevel=shape.surface==='dome'||shape.surface==='concave'?Math.min(lens.width,lens.height)/2:shape.bevel;
    const q=1-clamp(-d/bevel,0,1);
    const slope=depth*Math.min(32,q**(curvature-1)/Math.max(1e-6,(1-q**curvature)**((curvature-1)/curvature)));
    const angle=Math.atan(slope),bend=Math.sin(angle-Math.asin(Math.sin(angle)/shape.ior))*sign;
    // Continue the field across the silhouette. Coverage is analytic in the
    // shader; interpolating with a neutral exterior caused a broken last pixel.
    const dx=-sample.nx*bend,dy=-sample.ny*bend,mask=smooth(-d/.8);
    const edge=mask*Math.exp(-Math.max(0,-d-.6)/2),interior=smooth(-d/shape.bevel);
    const frost=shape.blurMode==='center'?interior:shape.blurMode==='edge'?1-interior:1;
    for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
      const mx=xx?width-1-x:x,my=yy?height-1-y:y;if((xx&&mx===x)||(yy&&my===y))continue;
      const sx=xx?-1:1,sy=yy?-1:1,i=(my*width+mx)*4;
      const ex=Math.round(32768+32767*dx*sx),ey=Math.round(32768+32767*dy*sy);
      displacement[i]=ex>>>8;displacement[i+1]=ex&255;displacement[i+2]=ey>>>8;displacement[i+3]=ey&255;
      const light=sign*(sample.nx*sx*-.6+sample.ny*sy*-.8);
      finish[i]=Math.round(mask*255);finish[i+1]=Math.round(edge*(.85*Math.max(0,light)+.2*Math.max(0,-light))*255);finish[i+2]=Math.round(frost*255);finish[i+3]=255;
    }
  }
  return {width,height,precision:16,displacement,finish};
}

function normalAt(x:number,y:number,shape:OpticalShape){
  const hx=shape.width/2,hy=shape.height/2,px=x-hx,py=y-hy;
  if(shape.shape==='circle'||shape.shape==='ellipse'){
    if(hx===hy){const length=Math.hypot(px,py);return {d:length-hx,nx:length?px/length:0,ny:length?py/length:0};}
    const e=.02,d=roundedDistance(x,y,shape),nx=roundedDistance(x+e,y,shape)-roundedDistance(x-e,y,shape),ny=roundedDistance(x,y+e,shape)-roundedDistance(x,y-e,shape),length=Math.hypot(nx,ny);
    return {d,nx:length?nx/length:0,ny:length?ny/length:0};
  }
  const continuous=shape.shape==='continuous',r=continuous?Math.min(shape.radius*1.34,hx,hy):shape.radius;
  const qx=Math.abs(px)-(hx-r),qy=Math.abs(py)-(hy-r),ax=Math.max(qx,0),ay=Math.max(qy,0);
  if(continuous&&qx>0&&qy>0){
    const p=2.85,n=(qx**p+qy**p)**(1/p),a=(qx/n)**(p-1),b=(qy/n)**(p-1),g=Math.hypot(a,b),f=n-r;
    const gx=(p-1)*(a*a/qx-a*g*g/n)/g,gy=(p-1)*(b*b/qy-b*g*g/n)/g;
    const dx=a/g-f*gx/(g*g),dy=b/g-f*gy/(g*g),length=Math.hypot(dx,dy);
    return {d:f/g,nx:dx/length*Math.sign(px),ny:dy/length*Math.sign(py)};
  }
  const length=Math.hypot(ax,ay),d=length+Math.min(Math.max(qx,qy),0)-r;
  return {d,nx:(length?ax/length:qx>qy?1:0)*Math.sign(px),ny:(length?ay/length:qx>qy?0:1)*Math.sign(py)};
}
