import {useEffect,useRef,useState,type HTMLAttributes,type ReactNode} from 'react';
import {Check,ChevronLeft,ChevronRight,ChevronsUpDown} from 'lucide-react';
import {GlassPopover,type GlassPopoverProps} from './popover.js';
import {classes,useControllable} from './context.js';
import type {GlassPickerOption} from './inputs.js';

export interface GlassMenuItem {id:string;label:string;icon?:ReactNode;detail?:string;shortcut?:string;disabled?:boolean;destructive?:boolean;checked?:boolean;kind?:'action'|'checkbox'|'radio';separatorBefore?:boolean;keepOpen?:boolean;onSelect?:()=>void;items?:readonly GlassMenuItem[]}
export interface GlassMenuProps extends Omit<GlassPopoverProps,'children'|'onSelect'> {items:readonly GlassMenuItem[];title?:string;layout?:'large'|'medium'|'small';palette?:readonly GlassMenuItem[];onSelect?:(id:string)=>void;orientation?:'vertical'|'horizontal'}
function closeMenu(node:HTMLElement){node.closest<HTMLElement>('[popover]')?.hidePopover();}
function MenuContent({items,title,palette=[],layout='large',onSelect,orientation='vertical',open}:{items:readonly GlassMenuItem[];title?:string;palette?:readonly GlassMenuItem[];layout?:'large'|'medium'|'small';onSelect?:(id:string)=>void;orientation?:'vertical'|'horizontal';open:boolean}){
  const [path,setPath]=useState<readonly GlassMenuItem[]>([]),[focused,setFocused]=useState(0),buttons=useRef<(HTMLButtonElement|null)[]>([]),typing=useRef({text:'',at:0});
  useEffect(()=>{if(!open){setPath([]);setFocused(0);typing.current={text:'',at:0};}},[open]);
  const parent=path.at(-1),rows:readonly GlassMenuItem[]=parent?[{id:'__back',label:parent.label,icon:<ChevronLeft size={18}/>,keepOpen:true,onSelect:()=>setPath(path.slice(0,-1))},...parent.items??[]]:items;
  const available=rows.map((item,i)=>item.disabled?-1:i).filter(i=>i>=0);
  const checks=rows.some(item=>item.checked!==undefined),symbols=rows.some(item=>item.icon);
  function focus(index:number){setFocused(index);buttons.current[index]?.focus();}
  function activate(item:GlassMenuItem,node:HTMLElement){
    if(item.disabled)return;
    if(item.items?.length){setPath([...path,item]);setFocused(0);requestAnimationFrame(()=>buttons.current[0]?.focus());return;}
    item.onSelect?.();if(item.id!=='__back')onSelect?.(item.id);
    if(!item.keepOpen)closeMenu(node);else if(item.id==='__back')requestAnimationFrame(()=>buttons.current[0]?.focus());
  }
  return <div className="prism-menu-content" onKeyDown={event=>{
    const nextKey=orientation==='horizontal'?'ArrowRight':'ArrowDown',prevKey=orientation==='horizontal'?'ArrowLeft':'ArrowUp';
    if([nextKey,prevKey,'Home','End'].includes(event.key)){event.preventDefault();const at=available.indexOf(focused),next=event.key==='Home'?available[0]:event.key==='End'?available.at(-1):available[(at+(event.key===nextKey?1:-1)+available.length)%available.length];if(next!==undefined)focus(next);}
    else if(event.key==='ArrowRight'&&orientation==='vertical'&&rows[focused]?.items?.length){event.preventDefault();activate(rows[focused],event.currentTarget);}
    else if(event.key==='ArrowLeft'&&path.length){event.preventDefault();setPath(path.slice(0,-1));requestAnimationFrame(()=>focus(0));}
    else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeMenu(event.currentTarget);}
    else if(event.key==='Tab')closeMenu(event.currentTarget);
    else if(event.key.length===1&&!event.metaKey&&!event.ctrlKey&&!event.altKey&&!event.nativeEvent.isComposing){const now=performance.now();typing.current={text:(now-typing.current.at<700?typing.current.text:'')+event.key.toLocaleLowerCase(),at:now};const match=available.find(i=>rows[i].label.toLocaleLowerCase().startsWith(typing.current.text));if(match!==undefined){event.preventDefault();focus(match);}}
  }}>
    {!parent&&title&&<div className="prism-menu-title">{title}</div>}
    {!parent&&palette.length>0&&layout!=='large'&&<div className="prism-menu-palette" data-layout={layout}>{palette.slice(0,layout==='small'?4:3).map(item=><button type="button" key={item.id} role="menuitem" disabled={item.disabled} aria-label={item.label} data-destructive={item.destructive||undefined} onClick={event=>activate(item,event.currentTarget)}>{item.icon}{layout==='medium'&&<span>{item.label}</span>}</button>)}</div>}
    <div className="prism-menu-rows" key={parent?.id??'root'}>{rows.map((item,index)=><div key={item.id} role="none">{item.separatorBefore&&<div className="prism-menu-divider" role="separator"/>}<button type="button" ref={node=>{buttons.current[index]=node;}} role={item.kind==='radio'?'menuitemradio':item.kind==='checkbox'||item.checked!==undefined?'menuitemcheckbox':'menuitem'} aria-checked={item.kind==='radio'||item.kind==='checkbox'||item.checked!==undefined?Boolean(item.checked):undefined} aria-haspopup={item.items?.length?'menu':undefined} disabled={item.disabled} data-destructive={item.destructive||undefined} tabIndex={focused===index?0:-1} onFocus={()=>setFocused(index)} onClick={event=>activate(item,event.currentTarget)}>
      {checks&&<span className="prism-menu-check" aria-hidden="true">{item.checked&&<Check size={17}/>}</span>}{symbols&&<span className="prism-menu-symbol" aria-hidden="true">{item.icon}</span>}<span className="prism-menu-label">{item.label}{item.detail&&<small>{item.detail}</small>}</span>{item.shortcut&&<kbd>{item.shortcut}</kbd>}{Boolean(item.items?.length)&&<ChevronRight className="prism-menu-chevron" size={14}/>}</button></div>)}</div>
  </div>;
}
export function GlassMenu({items,title,layout='large',palette,onSelect,orientation='vertical',className,onOpenChange,open:controlled,...props}:GlassMenuProps){
  const [open,setOpen]=useState(Boolean(controlled));
  return <GlassPopover placement="overlap" {...props} preset={props.preset??'menu'} className={classes('prism-menu',orientation==='horizontal'&&'prism-menu-horizontal',className)} role="menu" aria-orientation={orientation} aria-label={props['aria-label']??title??'Actions'} open={controlled} onOpenChange={next=>{setOpen(next);onOpenChange?.(next);}}><MenuContent items={items} title={title} layout={layout} palette={palette} onSelect={onSelect} orientation={orientation} open={open}/></GlassPopover>;
}
export interface GlassContextMenuProps extends Omit<HTMLAttributes<HTMLDivElement>,'onSelect'> {items:readonly GlassMenuItem[];label?:string;layout?:GlassMenuProps['layout'];palette?:readonly GlassMenuItem[];onSelect?:(id:string)=>void}
export function GlassContextMenu({children,items,label='Context menu',layout,palette,onSelect,className,onContextMenu,onKeyDown,onPointerDown,onPointerUp,onPointerMove,onPointerCancel,...props}:GlassContextMenuProps){
  const anchor=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),[point,setPoint]=useState<{x:number;y:number}|undefined>(undefined),hold=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),origin=useRef({x:0,y:0});
  const cancelHold=()=>{if(hold.current)clearTimeout(hold.current);hold.current=undefined;};
  useEffect(()=>cancelHold,[]);
  return <div {...props} ref={anchor} className={classes('prism-context-target',className)} tabIndex={props.tabIndex??0} aria-haspopup="menu" onContextMenu={event=>{onContextMenu?.(event);if(event.defaultPrevented)return;event.preventDefault();cancelHold();setPoint({x:event.clientX,y:event.clientY});setOpen(true);}} onKeyDown={event=>{onKeyDown?.(event);if(!event.defaultPrevented&&(event.key==='ContextMenu'||(event.key==='F10'&&event.shiftKey))){event.preventDefault();setPoint(undefined);setOpen(true);}}} onPointerDown={event=>{onPointerDown?.(event);if(event.defaultPrevented||event.pointerType!=='touch'||(event.target as Element).closest('input,textarea,[contenteditable=true]'))return;origin.current={x:event.clientX,y:event.clientY};hold.current=setTimeout(()=>{setPoint(origin.current);setOpen(true);},500);}} onPointerMove={event=>{onPointerMove?.(event);if(Math.hypot(event.clientX-origin.current.x,event.clientY-origin.current.y)>8)cancelHold();}} onPointerUp={event=>{onPointerUp?.(event);cancelHold();}} onPointerCancel={event=>{onPointerCancel?.(event);cancelHold();}}>{children}<GlassMenu trigger="Open context menu" triggerProps={{className:'prism-context-invoker',tabIndex:-1,'aria-hidden':true}} items={items} layout={layout} palette={palette} onSelect={onSelect} aria-label={label} anchorRef={anchor} anchorPoint={point} open={open} onOpenChange={setOpen}/></div>;
}
export interface GlassSelectProps extends Omit<GlassMenuProps,'items'|'trigger'|'onSelect'> {options:readonly GlassPickerOption[];value?:string;defaultValue?:string;onValueChange?:(value:string)=>void;disabled?:boolean;label?:string}
export function GlassSelect({options,value:controlled,defaultValue,onValueChange,disabled=false,label='Selection',triggerProps,...props}:GlassSelectProps){
  if(!options.length||new Set(options.map(option=>option.value)).size!==options.length)throw new Error('Select options must be nonempty and unique');
  const [value,setValue]=useControllable(controlled,defaultValue??options.find(option=>!option.disabled)?.value??options[0].value,onValueChange);
  const selected=options.find(option=>option.value===value)??options[0];
  return <GlassMenu {...props} trigger={<>{selected.label}<ChevronsUpDown size={16}/></>} triggerLabel={label} triggerProps={{emphasis:'plain',className:'prism-select-trigger',...triggerProps,disabled}} aria-label={props['aria-label']??label} items={options.map(option=>({id:option.value,label:option.label,disabled:option.disabled,kind:'radio',checked:option.value===value,onSelect:()=>setValue(option.value)}))}/>;
}
export function GlassEditMenu(props:GlassMenuProps){return <GlassMenu placement="below" {...props} preset="edit-menu" orientation="horizontal" className={classes('prism-edit-menu',props.className)}/>;}
export function GlassPullDownButton(props:GlassMenuProps){return <GlassMenu {...props}/>;}
export interface GlassActionSheetProps extends Omit<GlassMenuProps,'items'|'layout'|'palette'> {actions:readonly GlassMenuItem[];cancelLabel?:string}
export function GlassActionSheet({actions,cancelLabel,className,...props}:GlassActionSheetProps){
  return <GlassMenu placement="below" {...props} preset="action-sheet" className={classes('prism-action-sheet',className)} items={cancelLabel?[...actions,{id:'__cancel',label:cancelLabel}]:actions}/>;
}
