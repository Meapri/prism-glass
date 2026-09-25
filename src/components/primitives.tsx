import {forwardRef,useEffect,useRef,type CSSProperties,type HTMLAttributes,type ReactNode} from 'react';
import {X,ChevronRight,ChevronDown} from 'lucide-react';
import {GlassButton,GlassSurface,GlassToolbar,type GlassButtonProps,type GlassSurfaceProps} from './surface.js';
import {assignRef,classes,GlassContext,useControllable,useTheme,type MaterialProps} from './context.js';

export interface GlassChipProps extends Omit<GlassButtonProps,'shape'|'aria-pressed'> {
  selected?:boolean;defaultSelected?:boolean;onSelectedChange?:(selected:boolean)=>void;
}
export const GlassChip=forwardRef<HTMLButtonElement,GlassChipProps>(function GlassChip({selected:controlled,defaultSelected=false,onSelectedChange,onClick,className,emphasis,...props},ref){
  const [selected,setSelected]=useControllable(controlled,defaultSelected,onSelectedChange);
  return <GlassButton {...props} ref={ref} shape="capsule" preset="chip" emphasis={emphasis??(selected?'prominent':'glass')} aria-pressed={selected} className={classes('prism-chip',className)} onClick={event=>{onClick?.(event);if(!event.defaultPrevented)setSelected(!selected);}}/>;
});
export interface GlassTokenProps extends GlassSurfaceProps {onRemove?:()=>void;removeLabel?:string;disabled?:boolean}
export function GlassToken({children,onRemove,removeLabel='Remove token',disabled,className,...props}:GlassTokenProps){
  return <GlassSurface {...props} preset="chip" className={classes('prism-token',className)}><span>{children}</span>{onRemove&&<button type="button" aria-label={removeLabel} disabled={disabled} onClick={onRemove}><X size={12}/></button>}</GlassSurface>;
}

export type StandardMaterial='ultra-thin'|'thin'|'regular'|'thick';
export interface MaterialSurfaceProps extends HTMLAttributes<HTMLDivElement>,Pick<MaterialProps,'appearance'> {material?:StandardMaterial}
export const MaterialSurface=forwardRef<HTMLDivElement,MaterialSurfaceProps>(function MaterialSurface({material='regular',appearance,className,...props},ref){
  const theme=useTheme({appearance});
  return <div {...props} ref={ref} className={classes('prism-standard-material',className)} data-material={material} data-appearance={theme.appearance}/>;
});
export function GlassSeparator({className,...props}:HTMLAttributes<HTMLHRElement>){return <hr {...props} className={classes('prism-separator',className)}/>;}
export interface GlassProgressProps extends Omit<HTMLAttributes<HTMLDivElement>,'children'> {value?:number;max?:number;size?:'small'|'regular';label?:string;kind?:'linear'|'circular'}
export function GlassProgress({value,max=1,size='regular',label='Loading',kind='linear',className,style,...props}:GlassProgressProps){
  const finiteMax=Number.isFinite(max)&&max>0?max:1,progress=value===undefined?undefined:Math.min(1,Math.max(0,(Number.isFinite(value)?value:0)/finiteMax));
  return <div {...props} className={classes('prism-progress',className)} role="progressbar" aria-label={props['aria-label']??label} aria-valuenow={progress===undefined?undefined:progress*100} aria-valuemin={0} aria-valuemax={100} data-kind={kind} data-indeterminate={progress===undefined} style={{'--prism-progress-value':`${(progress??0)*100}%`,...style} as CSSProperties}>
    {kind==='circular'?progress===undefined?<span className={classes('prism-spinner',size==='small'&&'prism-spinner-small')} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--prism-spoke':i} as CSSProperties}/>)}</span>:<svg viewBox="0 0 24 24" width={size==='small'?16:24} height={size==='small'?16:24} aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" opacity=".15" strokeWidth="2.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${progress*56.55} 56.55`} transform="rotate(-90 12 12)"/></svg>:<span className="prism-progress-fill" aria-hidden="true"/>}
  </div>;
}
export interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {count?:number;max?:number;dot?:boolean}
export function GlassBadge({count,max=99,dot=false,children,className,...props}:GlassBadgeProps){
  if(count!==undefined&&count<=0&&!children&&!dot)return null;
  return <span {...props} className={classes('prism-badge',className)} data-dot={dot||undefined}>{dot?null:children??(count!==undefined?count>max?`${max}+`:count:null)}</span>;
}

export function GlassDock({children,className,variant='clear',dimming=0,tint=[1,1,1,.035],...props}:GlassSurfaceProps){
  const theme=useTheme({...props,variant,dimming,tint});
  return <GlassToolbar {...props} preset="dock" shape="continuous" radius={36} variant={variant} dimming={dimming} tint={tint} className={classes('prism-dock',className)} aria-label={props['aria-label']??'Dock'}><GlassContext.Provider value={{...theme,nested:false}}>{children}</GlassContext.Provider></GlassToolbar>;
}
export interface GlassDockItemProps extends GlassButtonProps {badge?:number;label:string}
export const GlassDockItem=forwardRef<HTMLButtonElement,GlassDockItemProps>(function GlassDockItem({badge,label,children,className,style,...props},ref){
  return <GlassButton {...props} ref={ref} preset="dock-item" shape="continuous" radius={20} aria-label={props['aria-label']??label} className={classes('prism-dock-item',className)} style={{'--prism-control-height':'100%',...style} as CSSProperties}><span className="prism-dock-symbol">{children}</span>{badge!==undefined&&<GlassBadge count={badge}/>}</GlassButton>;
});

export interface GlassControlTileProps extends Omit<GlassButtonProps,'size'|'aria-pressed'> {size?:'small'|'wide'|'large';selected?:boolean;defaultSelected?:boolean;onSelectedChange?:(selected:boolean)=>void;label:string;subtitle?:string;symbol?:ReactNode}
export const GlassControlTile=forwardRef<HTMLButtonElement,GlassControlTileProps>(function GlassControlTile({size='small',selected:controlled,defaultSelected=false,onSelectedChange,label,subtitle,symbol,children,className,onClick,style,...props},ref){
  const [selected,setSelected]=useControllable(controlled,defaultSelected,onSelectedChange);
  return <GlassButton {...props} ref={ref} preset="control" shape={size==='small'?'circle':'continuous'} radius={28} emphasis={selected?'prominent':'glass'} aria-label={props['aria-label']??label} aria-pressed={selected} data-tile-size={size} className={classes('prism-control-tile',className)} style={{'--prism-control-height':'100%',...style} as CSSProperties} onClick={event=>{onClick?.(event);if(!event.defaultPrevented)setSelected(!selected);}}>{symbol}<span className={size==='small'?'prism-visually-hidden':'prism-control-copy'}><strong>{label}</strong>{subtitle&&<small>{subtitle}</small>}</span>{children}</GlassButton>;
});

export interface GlassNotificationAction {id:string;label:string;onSelect:()=>void;destructive?:boolean;disabled?:boolean}
export interface GlassNotificationProps extends Omit<GlassSurfaceProps,'title'> {title:string;message:ReactNode;appName?:string;icon?:ReactNode;time?:string;onActivate?:()=>void;onDismiss?:()=>void;actions?:readonly GlassNotificationAction[];expanded?:boolean}
export function GlassNotification({title,message,appName,icon,time,onActivate,onDismiss,actions=[],expanded=false,className,...props}:GlassNotificationProps){
  if(actions.length>4)throw new RangeError('A notification supports up to four actions');
  const copy=<><span className="prism-notification-icon" aria-hidden="true">{icon}</span><span className="prism-notification-copy">{appName&&<small>{appName}</small>}<strong>{title}</strong><span>{message}</span></span>{time&&<time>{time}</time>}</>;
  return <GlassSurface {...props} preset="notification" className={classes('prism-notification',className)} data-expanded={expanded||undefined}>
    {onActivate?<button className="prism-notification-main" type="button" onClick={onActivate}>{copy}</button>:<div className="prism-notification-main" role="status">{copy}</div>}
    {onDismiss&&<button type="button" className="prism-notification-dismiss" aria-label="Dismiss notification" onClick={onDismiss}><X size={14}/></button>}
    {expanded&&actions.length>0&&<div className="prism-notification-actions">{actions.map(action=><button key={action.id} type="button" disabled={action.disabled} data-destructive={action.destructive||undefined} onClick={action.onSelect}>{action.label}</button>)}</div>}
  </GlassSurface>;
}
export interface GlassLiveActivityProps extends GlassSurfaceProps {presentation?:'banner'|'compact'|'minimal'|'expanded';leading?:ReactNode;trailing?:ReactNode;label?:string}
export function GlassLiveActivity({presentation='banner',leading,trailing,label='Live activity',children,className,tint,...props}:GlassLiveActivityProps){
  const compact=presentation==='compact'||presentation==='minimal';
  return <GlassSurface {...props} preset="live-activity" shape={compact?'capsule':'continuous'} tint={tint??(compact?[0,0,0,1]:undefined)} appearance={compact?'dark':props.appearance} aria-label={label} className={classes('prism-live-activity',className)} data-presentation={presentation}><div className="prism-live-leading">{leading}</div><div className="prism-live-content">{children}</div><div className="prism-live-trailing">{trailing}</div></GlassSurface>;
}
export interface GlassWidgetProps extends GlassSurfaceProps {size?:'small'|'medium'|'large';renderingMode?:'full-color'|'clear'|'tinted';accent?:readonly[number,number,number]}
export function GlassWidget({size='small',renderingMode='clear',accent=[.1,.45,.9],children,className,...props}:GlassWidgetProps){
  const theme=useTheme(props);
  if(renderingMode==='full-color')return <div className={classes('prism-widget prism-widget-full',className)} data-size={size} data-appearance={theme.appearance} style={props.style}><GlassContext.Provider value={theme}>{children}</GlassContext.Provider></div>;
  return <GlassSurface {...props} preset="widget" className={classes('prism-widget',className)} data-size={size} data-rendering-mode={renderingMode} tint={props.tint??(renderingMode==='tinted'?[...accent,.75]:undefined)}>{children}</GlassSurface>;
}
export function GlassSnippet({children,className,...props}:GlassSurfaceProps){return <GlassSurface {...props} preset="popover" className={classes('prism-snippet',className)}>{children}</GlassSurface>;}

export interface GlassDisclosureProps extends Omit<HTMLAttributes<HTMLDetailsElement>,'onToggle'|'title'> {title:ReactNode;open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void}
export function GlassDisclosure({title,open:controlled,defaultOpen=false,onOpenChange,children,className,...props}:GlassDisclosureProps){
  const [open,setOpen]=useControllable(controlled,defaultOpen,onOpenChange);
  return <details {...props} open={open} className={classes('prism-disclosure',className)} onToggle={event=>{if(event.currentTarget.open!==open)setOpen(event.currentTarget.open);}}><summary>{title}<ChevronDown size={15} aria-hidden="true"/></summary><div>{children}</div></details>;
}
export interface GlassScrollAreaProps extends HTMLAttributes<HTMLDivElement> {edgeEffect?:'soft'|'hard'|'none'}
export const GlassScrollArea=forwardRef<HTMLDivElement,GlassScrollAreaProps>(function GlassScrollArea({edgeEffect='soft',children,className,style,onScroll,...props},ref){
  const root=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
  function update(){const node=root.current;if(!node)return;node.parentElement!.dataset.top=String(node.scrollTop>1);node.parentElement!.dataset.bottom=String(node.scrollTop+node.clientHeight<node.scrollHeight-1);}
  useEffect(()=>{const observer=new ResizeObserver(update);observer.observe(root.current!);observer.observe(content.current!);update();return()=>observer.disconnect();},[]);
  return <div className={classes('prism-scroll-area',className)} data-edge={edgeEffect} style={style}><div {...props} ref={node=>{root.current=node;assignRef(ref,node);}} className="prism-scroll-viewport" onScroll={event=>{onScroll?.(event);update();}} tabIndex={props.tabIndex??0}><div ref={content}>{children}</div></div><div className="prism-scroll-edge prism-scroll-edge-top" aria-hidden="true"/><div className="prism-scroll-edge prism-scroll-edge-bottom" aria-hidden="true"/></div>;
});
export function GlassBackgroundExtension({src,children,className,...props}:HTMLAttributes<HTMLDivElement>&{src:string}){return <div {...props} className={classes('prism-background-extension',className)}><img src={src} alt="" aria-hidden="true"/><div>{children}</div></div>;}

export interface GlassSidebarItem {value:string;label:string;icon?:ReactNode;badge?:number;disabled?:boolean}
export interface GlassSidebarProps extends GlassSurfaceProps {items:readonly GlassSidebarItem[];value?:string;defaultValue?:string;onValueChange?:(value:string)=>void;heading?:string}
export function GlassSidebar({items,value:controlled,defaultValue,onValueChange,heading,className,...props}:GlassSidebarProps){
  const [value,setValue]=useControllable(controlled,defaultValue??items.find(item=>!item.disabled)?.value??'',onValueChange);
  return <GlassSurface {...props} preset="sidebar" className={classes('prism-sidebar',className)}>{heading&&<h3>{heading}</h3>}<nav aria-label={props['aria-label']??heading??'Sidebar'}>{items.map(item=><button key={item.value} type="button" disabled={item.disabled} aria-current={value===item.value?'page':undefined} onClick={()=>setValue(item.value)}>{item.icon}<span>{item.label}</span>{item.badge!==undefined&&<GlassBadge count={item.badge}/>}</button>)}</nav></GlassSurface>;
}
export interface GlassNavigationBarProps extends HTMLAttributes<HTMLElement>,MaterialProps {title:string;largeTitle?:boolean;leading?:ReactNode;trailing?:ReactNode;subtitle?:string;children?:ReactNode}
export function GlassNavigationBar({title,largeTitle=false,leading,trailing,subtitle,children,className,variant,appearance,tintLevel,dimming,tint,preset,backdrop,refractionTarget,optics,present,onPresenceChange,...props}:GlassNavigationBarProps){
  const material={variant,appearance,tintLevel,dimming,tint};
  return <header {...props} className={classes('prism-navigation-bar',className)}><div className="prism-navigation-row"><div>{leading&&<GlassToolbar {...material}>{leading}</GlassToolbar>}</div>{largeTitle?<div aria-hidden="true"/>:<div className="prism-navigation-title"><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}</div>}<div>{trailing&&<GlassToolbar {...material}>{trailing}</GlassToolbar>}</div></div>{largeTitle&&<div className="prism-large-title"><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>}{children}</header>;
}
export interface GlassTabBarItem {value:string;label:string;icon:ReactNode;badge?:number;disabled?:boolean}
export interface GlassTabBarProps extends GlassSurfaceProps {items:readonly GlassTabBarItem[];value?:string;defaultValue?:string;onValueChange?:(value:string)=>void;minimized?:boolean;accessory?:ReactNode}
export function GlassTabBar({items,value:controlled,defaultValue,onValueChange,minimized=false,accessory,className,...props}:GlassTabBarProps){
  const [value,setValue]=useControllable(controlled,defaultValue??items.find(item=>!item.disabled)?.value??'',onValueChange);
  const buttons=useRef<(HTMLButtonElement|null)[]>([]);
  return <div className="prism-tab-bar-stack">{accessory&&<GlassSurface {...props} preset="toolbar" className="prism-tab-accessory">{accessory}</GlassSurface>}<GlassSurface {...props} preset="tab-bar" className={classes('prism-tab-bar',className)} data-minimized={minimized||undefined} role="tablist" aria-label={props['aria-label']??'Navigation'}>{items.map((item,index)=><button key={item.value} type="button" ref={node=>{buttons.current[index]=node;}} role="tab" aria-selected={value===item.value} disabled={item.disabled} tabIndex={value===item.value?0:-1} onClick={()=>setValue(item.value)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const available=items.map((it,i)=>it.disabled?-1:i).filter(i=>i>=0),at=available.indexOf(index);const rtl=getComputedStyle(event.currentTarget).direction==='rtl';const step=(event.key==='ArrowRight'?1:-1)*(rtl?-1:1);const next=event.key==='Home'?available[0]:event.key==='End'?available.at(-1):available[(at+step+available.length)%available.length];if(next!==undefined){setValue(items[next].value);buttons.current[next]?.focus();}}}><span className="prism-tab-icon">{item.icon}{item.badge!==undefined&&<GlassBadge count={item.badge}/>}</span><span className="prism-tab-label">{item.label}</span></button>)}</GlassSurface></div>;
}
export function GlassInputAccessory({children,className,...props}:GlassSurfaceProps){return <GlassToolbar {...props} preset="input-accessory" className={classes('prism-input-accessory',className)}>{children}</GlassToolbar>;}
export function GlassListRow({children,detail,chevron=false,className,...props}:HTMLAttributes<HTMLDivElement>&{detail?:ReactNode;chevron?:boolean}){return <div {...props} className={classes('prism-list-row',className)}><span>{children}</span>{detail&&<span className="prism-secondary">{detail}</span>}{chevron&&<ChevronRight size={16} aria-hidden="true"/>}</div>;}
