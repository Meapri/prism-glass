import {forwardRef,useEffect,useId,useRef,useState,type CSSProperties,type ReactNode,type RefObject} from 'react';
import {X,Share2,Link,Copy,Mail,MessageCircle} from 'lucide-react';
import {GlassSurface,GlassButton,type GlassSurfaceProps} from './surface.js';
import {assignRef,classes,useControllable,useTheme} from './context.js';
import type {GlassPresencePhase} from '../presence.js';
import {GlassMediaScene} from './media-scene.js';
import type {GlassMediaSource} from '../media-types.js';

export interface GlassDialogProps extends Omit<GlassSurfaceProps,'title'|'role'|'present'|'local'> {
  open:boolean;onOpenChange:(open:boolean)=>void;role?:'dialog'|'alertdialog';dismissible?:boolean;dismissOnBackdrop?:boolean;kind?:'dialog'|'sheet';initialFocusRef?:RefObject<HTMLElement|null>;returnFocusRef?:RefObject<HTMLElement|null>;dialogStyle?:CSSProperties;dialogClassName?:string;source?:RefObject<GlassMediaSource|null>;sourceVersion?:string|number;
}
export const GlassDialog=forwardRef<HTMLDialogElement,GlassDialogProps>(function GlassDialog({open,onOpenChange,role='dialog',dismissible=true,dismissOnBackdrop=true,kind='dialog',initialFocusRef,returnFocusRef,dialogStyle,dialogClassName,source,sourceVersion,children,className,onPresenceChange,...props},ref){
  const dialog=useRef<HTMLDialogElement>(null),previous=useRef<HTMLElement|null>(null),latest=useRef({open,onOpenChange});latest.current={open,onOpenChange};
  const [present,setPresent]=useState(false),pointerOutside=useRef(false),theme=useTheme(props);
  useEffect(()=>{const node=dialog.current;if(!node)return;if(open){if(!node.open){previous.current=returnFocusRef?.current??node.ownerDocument.activeElement as HTMLElement|null;node.showModal();}setPresent(true);}else setPresent(false);},[open]);
  useEffect(()=>()=>{const node=dialog.current;if(node?.open)node.close();},[]);
  function phase(next:GlassPresencePhase){onPresenceChange?.(next);const node=dialog.current;if(!node)return;
    if(next==='entering')queueMicrotask(()=>{if(!latest.current.open)return;(initialFocusRef?.current??node.querySelector<HTMLElement>('[autofocus],[data-autofocus]')??node.querySelector<HTMLElement>('input:not(:disabled),button:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')??node).focus({preventScroll:true});});
    if(next==='hidden'&&!latest.current.open&&node.open){node.close();if(previous.current?.isConnected)previous.current.focus({preventScroll:true});}
  }
  function outside(event:{clientX:number;clientY:number}){const rect=dialog.current!.getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;}
  const panel=<GlassSurface {...props} local={!source} present={present} onPresenceChange={phase} className={classes('prism-dialog-panel',className)}>{children}</GlassSurface>;
  return <dialog ref={node=>{dialog.current=node;assignRef(ref,node);}} className={classes('prism-dialog',dialogClassName)} data-kind={kind} data-appearance={theme.appearance} data-closing={!open||undefined} role={role} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-modal="true" style={dialogStyle} onCancel={event=>{event.preventDefault();if(dismissible)latest.current.onOpenChange(false);}} onClose={()=>{if(latest.current.open)latest.current.onOpenChange(false);}} onPointerDown={event=>{pointerOutside.current=event.target===event.currentTarget&&outside(event);}} onClick={event=>{if(dismissible&&dismissOnBackdrop&&pointerOutside.current&&event.target===event.currentTarget&&outside(event))latest.current.onOpenChange(false);pointerOutside.current=false;}}>
    {source?<GlassMediaScene source={source} sourceVersion={sourceVersion} appearance={props.appearance} variant={props.variant??'regular'} tint={props.tint} dimming={props.dimming} media={{sourceAlignment:'element'}} className="prism-portal-media">{panel}</GlassMediaScene>:panel}
  </dialog>;
});
export interface GlassAlertAction {label:string;onSelect?:()=>void;intent?:'default'|'destructive'|'cancel';disabled?:boolean;autoFocus?:boolean;close?:boolean}
export interface GlassAlertProps extends Omit<GlassSurfaceProps,'title'> {title:string;message?:ReactNode;actions?:readonly GlassAlertAction[];onAction?:(index:number)=>void;stackActions?:boolean}
export function GlassAlert({title,message,actions=[],onAction,stackActions=false,children,className,...props}:GlassAlertProps){
  const id=useId();
  return <GlassSurface {...props} preset="alert" className={classes('prism-alert',className)} aria-labelledby={props['aria-labelledby']??`${id}-title`} aria-describedby={props['aria-describedby']??(message?`${id}-message`:undefined)}><AlertContent title={title} message={message} titleId={`${id}-title`} messageId={`${id}-message`} actions={actions} onAction={onAction} stackActions={stackActions}>{children}</AlertContent></GlassSurface>;
}
function AlertContent({title,message,titleId,messageId,actions,onAction,stackActions,children}:{title:string;message?:ReactNode;titleId:string;messageId:string;actions:readonly GlassAlertAction[];onAction?:(index:number)=>void;stackActions?:boolean;children?:ReactNode}){
  return <><div className="prism-alert-header"><h2 id={titleId}>{title}</h2>{message&&<div className="prism-alert-message" id={messageId}>{message}</div>}{children&&<div className="prism-alert-fields">{children}</div>}</div>{actions.length>0&&<div className="prism-alert-actions" data-stacked={stackActions||actions.length>2||undefined}>{actions.map((action,index)=><button key={`${action.label}-${index}`} type="button" disabled={action.disabled} data-intent={action.intent??'default'} data-autofocus={action.autoFocus||undefined} onClick={()=>{action.onSelect?.();onAction?.(index);}}>{action.label}</button>)}</div>}</>;
}
export interface GlassAlertDialogProps extends Omit<GlassDialogProps,'role'|'kind'|'title'> {title:string;message?:ReactNode;actions:readonly GlassAlertAction[];stackActions?:boolean}
export const GlassAlertDialog=forwardRef<HTMLDialogElement,GlassAlertDialogProps>(function GlassAlertDialog({title,message,actions,stackActions,children,className,onOpenChange,...props},ref){
  const id=useId();return <GlassDialog {...props} ref={ref} onOpenChange={onOpenChange} role="alertdialog" preset="alert" dismissOnBackdrop={false} className={classes('prism-alert',className)} aria-labelledby={`${id}-title`} aria-describedby={message?`${id}-message`:undefined}><AlertContent title={title} message={message} titleId={`${id}-title`} messageId={`${id}-message`} actions={actions} stackActions={stackActions} onAction={index=>{if(actions[index]?.close!==false)onOpenChange(false);}}>{children}</AlertContent></GlassDialog>;
});

export type GlassSheetDetent='medium'|'large'|number;
export interface GlassSheetProps extends Omit<GlassDialogProps,'kind'|'title'> {title?:string;detents?:readonly GlassSheetDetent[];detent?:GlassSheetDetent;defaultDetent?:GlassSheetDetent;onDetentChange?:(detent:GlassSheetDetent)=>void;leading?:ReactNode;trailing?:ReactNode;showGrabber?:boolean}
const defaultDetents:readonly GlassSheetDetent[]=['medium','large'];
export const GlassSheet=forwardRef<HTMLDialogElement,GlassSheetProps>(function GlassSheet({title,detents=defaultDetents,detent:controlled,defaultDetent,onDetentChange,leading,trailing,showGrabber=true,children,className,dialogStyle,onOpenChange,open,...props},ref){
  if(!detents.length||detents.some(d=>typeof d==='number'&&(!Number.isFinite(d)||d<=0)))throw new RangeError('Sheet detents must be positive heights or medium/large');
  const [detent,setDetent]=useControllable(controlled,defaultDetent??detents[0],onDetentChange),[viewport,setViewport]=useState(812),dialog=useRef<HTMLDialogElement>(null),drag=useRef<{id:number;y:number;height:number;time:number;lastY:number;lastAt:number;moved:boolean}|null>(null),id=useId();
  const heightFor=(d:GlassSheetDetent)=>Math.min(viewport-24,typeof d==='number'?d:d==='medium'?Math.min(viewport-24,viewport*.5+44):viewport-24),heights=detents.map(d=>({d,height:heightFor(d)})).sort((a,b)=>a.height-b.height),height=heightFor(detent);
  useEffect(()=>{const win=dialog.current?.ownerDocument.defaultView;if(!win)return;const update=()=>setViewport(win.visualViewport?.height??win.innerHeight);update();win.addEventListener('resize',update);win.visualViewport?.addEventListener('resize',update);return()=>{win.removeEventListener('resize',update);win.visualViewport?.removeEventListener('resize',update);};},[]);
  function paint(next:number){dialog.current?.style.setProperty('--prism-sheet-height',`${Math.max(80,Math.min(viewport-16,next))}px`);}
  function choose(next:GlassSheetDetent){setDetent(next);paint(heightFor(next));}
  function cycle(){const at=heights.findIndex(item=>item.d===detent);choose(heights[(at+1)%heights.length].d);}
  function end(event:React.PointerEvent<HTMLElement>,cancelled=false){const state=drag.current;if(!state||state.id!==event.pointerId)return;drag.current=null;dialog.current?.removeAttribute('data-dragging');if(cancelled){paint(height);return;}const delta=event.clientY-state.y,next=state.height-delta,velocity=(event.clientY-state.lastY)/Math.max(1,performance.now()-state.lastAt);if(!state.moved){cycle();return;}if(props.dismissible!==false&&(next<heights[0].height-80||(velocity>.8&&delta>35&&detent===heights[0].d))){onOpenChange(false);return;}const nearest=heights.reduce((best,item)=>Math.abs(item.height-next)<Math.abs(best.height-next)?item:best,heights[0]);choose(nearest.d);}
  const panel=<><div className="prism-sheet-header" onPointerDown={event=>{if(!showGrabber||event.button!==0||(event.target as Element).closest('button:not([data-sheet-grabber])'))return;drag.current={id:event.pointerId,y:event.clientY,height:dialog.current?.getBoundingClientRect().height??height,time:performance.now(),lastY:event.clientY,lastAt:performance.now(),moved:false};event.currentTarget.setPointerCapture(event.pointerId);dialog.current?.setAttribute('data-dragging','true');}} onPointerMove={event=>{const state=drag.current;if(!state||state.id!==event.pointerId)return;const delta=event.clientY-state.y;state.moved ||= Math.abs(delta)>4;paint(state.height-delta);state.lastY=event.clientY;state.lastAt=performance.now();}} onPointerUp={event=>end(event)} onPointerCancel={event=>end(event,true)}>
    {showGrabber&&<button type="button" className="prism-sheet-grabber" data-sheet-grabber="" role="slider" aria-label="Sheet size" aria-valuemin={Math.round(heights[0].height)} aria-valuemax={Math.round(heights.at(-1)!.height)} aria-valuenow={Math.round(height)} aria-valuetext={typeof detent==='number'?`${detent} pixels`:detent} onClick={event=>{if(event.detail===0)cycle();}} onKeyDown={event=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const at=heights.findIndex(item=>item.d===detent),next=event.key==='Home'?0:event.key==='End'?heights.length-1:Math.max(0,Math.min(heights.length-1,at+(event.key==='ArrowUp'?1:-1)));choose(heights[next].d);}}><span/></button>}
    {(title||leading||trailing)&&<div className="prism-sheet-toolbar"><div>{leading}</div>{title&&<h2 id={`${id}-title`}>{title}</h2>}<div>{trailing}</div></div>}
  </div><div className="prism-sheet-content">{children}</div></>;
  return <GlassDialog {...props} open={open} onOpenChange={onOpenChange} kind="sheet" preset="sheet" ref={node=>{dialog.current=node;assignRef(ref,node);}} className={classes('prism-sheet-panel',className)} aria-labelledby={props['aria-labelledby']??(title?`${id}-title`:undefined)} dialogStyle={{'--prism-sheet-height':`${height}px`,...dialogStyle} as CSSProperties}>{panel}</GlassDialog>;
});

export interface GlassShareItem {id:string;label:string;icon:ReactNode;onSelect:()=>void;disabled?:boolean}
export interface GlassShareSheetProps extends Omit<GlassSheetProps,'title'> {title:string;subtitle?:string;preview?:ReactNode;destinations?:readonly GlassShareItem[];actions?:readonly GlassShareItem[];url?:string}
export function GlassShareSheet({title,subtitle,preview,destinations=[],actions=[],url,children,onOpenChange,...props}:GlassShareSheetProps){
  const [status,setStatus]=useState('');
  const choices:readonly GlassShareItem[]=actions.length?actions:url?[{id:'copy-link',label:'Copy link',icon:<Link size={20}/>,onSelect:()=>{void navigator.clipboard.writeText(url).then(()=>setStatus('Link copied'),()=>setStatus('Copy unavailable'));}}]:[];
  return <GlassSheet {...props} onOpenChange={onOpenChange} title="Share" trailing={<GlassButton aria-label="Close share sheet" shape="circle" emphasis="bordered" onClick={()=>onOpenChange(false)}><X size={18}/></GlassButton>}>
    <div className="prism-share-preview"><div>{preview??<Share2 size={24}/>}</div><span><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}</span></div>
    {destinations.length>0&&<div className="prism-share-destinations">{destinations.map(destination=><button type="button" key={destination.id} disabled={destination.disabled} onClick={destination.onSelect}><span>{destination.icon}</span><small>{destination.label}</small></button>)}</div>}
    {choices.length>0&&<div className="prism-share-actions">{choices.map(action=><button key={action.id} type="button" disabled={action.disabled} onClick={action.onSelect}>{action.label}{action.icon}</button>)}</div>}{children}{status&&<p role="status" className="prism-share-status">{status}</p>}
  </GlassSheet>;
}
