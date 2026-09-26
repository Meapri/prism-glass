# Public API reference

Generated for `@meapri/prism-glass@0.5.0-alpha.2` from emitted TypeScript declarations and checked against actual runtime exports. Do not edit by hand.

Import only from the entry points below. Declaration-file paths are for reading types, not supported deep imports. JSX components, hooks and utilities are separate exports; the export count is not a component count. Inherited native React/DOM props remain defined by their declared base types.

## @meapri/prism-glass

Runtime exports (26): `adaptGlassMaterial`, `bindGlassInteraction`, `blendGlassMaterial`, `createBackdropSampler`, `createGlass`, `createGlassPresence`, `customizeGlassMaterial`, `getGlassMaterial`, `getGlassPreset`, `getGlassSurfaceProfile`, `getLensMaterial`, `glassLightAt`, `glassPresenceFrame`, `glassSurfacePresets`, `lensFor`, `linearChannel`, `materialOptics`, `normalizeGlassTint`, `observeGlassBackdrop`, `observeGlassPreferences`, `relativeLuminance`, `resolveGlassSurface`, `stepSpring`, `summarizeBackdrop`, `updateGlassAdaptation`, `validBackdrop`.

Types entry: `./dist/index.d.ts`.

### adaptGlassMaterial

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare function adaptGlassMaterial(material: GlassMaterial, state: GlassAdaptiveState): GlassMaterial;
```

### bindGlassInteraction

Runtime export · declared in `dist/motion.d.ts`.

```ts
export declare function bindGlassInteraction(element: HTMLElement, onChange?: (state: GlassInteraction) => void): GlassInteractionController;
```

### blendGlassMaterial

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare function blendGlassMaterial(from: GlassMaterial, to: GlassMaterial, amount: number): GlassMaterial;
```

### BlurMode

Type only · declared in `dist/optics.d.ts`.

```ts
export type BlurMode = 'uniform' | 'center' | 'edge';
```

### createBackdropSampler

Runtime export · declared in `dist/backdrop.d.ts`.

```ts
export declare function createBackdropSampler(doc: Document): {
    begin(): void;
    media(source: GlassMediaSource, lens: {
        x: number;
        y: number;
        width: number;
        height: number;
    }, sourceRect: readonly number[], background: readonly [number, number, number]): GlassBackdropSample | null;
    dom(element: HTMLElement, source?: Element): GlassBackdropSample | null;
    destroy(): void;
};
interface Subscriber {
    element: HTMLElement;
    callback: (sample: GlassBackdropSample | null) => void;
    options: GlassBackdropOptions;
}
```

### createGlass

Runtime export · declared in `dist/index.d.ts`.

```ts
export declare function createGlass(source: HTMLElement, options: GlassOptions): GlassController;
```

### createGlassPresence

Runtime export · declared in `dist/presence.d.ts`.

```ts
export declare function createGlassPresence(element: HTMLElement, options?: GlassPresenceOptions): GlassPresenceController;
```

### customizeGlassMaterial

Runtime export · declared in `dist/materials.d.ts`.

```ts
export declare function customizeGlassMaterial(material: GlassMaterial, options: {
    tint?: GlassTint;
    dimming?: number;
}): GlassMaterial;
```

### getGlassMaterial

Runtime export · declared in `dist/materials.d.ts`.

```ts
export declare function getGlassMaterial(variant?: GlassVariant, appearance?: GlassAppearance, tintLevel?: number): GlassMaterial;
```

### getGlassPreset

Runtime export · declared in `dist/presets.d.ts`.

```ts
export declare function getGlassPreset(preset: GlassPreset, lens: Lens): GlassOptions;
```

### getGlassSurfaceProfile

Runtime export · declared in `dist/surface-presets.d.ts`.

```ts
export declare function getGlassSurfaceProfile(name: GlassSurfacePreset): Readonly<GlassSurfaceProfile>;
```

### getLensMaterial

Runtime export · declared in `dist/materials.d.ts`.

```ts
export declare function getLensMaterial(lens: Lens, variant?: GlassVariant, appearance?: GlassAppearance, tintLevel?: number): GlassMaterial;
```

### GlassAdaptationPolicy

Type only · declared in `dist/surface-presets.d.ts`.

```ts
export type GlassAdaptationPolicy = 'flip' | 'ambient';
```

### GlassAdaptiveState

Type only · declared in `dist/adaptive.d.ts`.

```ts
export interface GlassAdaptiveState {
    appearance: GlassAppearance;
    luminance: number;
    variance: number;
    color: readonly [number, number, number];
    at: number;
    candidate: GlassAppearance;
    since: number;
    available: boolean;
}
```

### GlassAppearance

Type only · declared in `dist/materials.d.ts`.

```ts
export type GlassAppearance = 'light' | 'dark';
```

### GlassAppearanceMode

Type only · declared in `dist/adaptive.d.ts`.

```ts
export type GlassAppearanceMode = GlassAppearance | 'auto' | 'adaptive';
```

### GlassBackdropOptions

Type only · declared in `dist/backdrop.d.ts`.

```ts
export interface GlassBackdropOptions {
    source?: Element;
    sample?: GlassBackdropReader;
}
```

### GlassBackdropReader

Type only · declared in `dist/backdrop.d.ts`.

```ts
export type GlassBackdropReader = () => GlassBackdropSample | null;
```

### GlassBackdropSample

Type only · declared in `dist/adaptive.d.ts`.

```ts
export interface GlassBackdropSample {
    /** Linear-light relative luminance, not gamma-encoded RGB brightness. */
    luminance: number;
    variance: number;
    color: readonly [number, number, number];
    source: 'css' | 'pixels' | 'provided';
    confidence: number;
}
```

### GlassController

Type only · declared in `dist/types.d.ts`.

```ts
export interface GlassController {
    update(patch: GlassPatch): void;
    refresh(): void;
    getDiagnostics(): GlassDiagnostics;
    destroy(): void;
}
```

### GlassDiagnostics

Type only · declared in `dist/types.d.ts`.

```ts
export interface GlassDiagnostics {
    state: 'loading' | 'ready' | 'disabled' | 'paused' | 'limited' | 'error' | 'destroyed';
    reason: string;
    renderer: 'svg-source';
    mapBuilds: number;
    renders: number;
    mapGenerationMs: number;
    sourcePixels: number;
    mapSize: [number, number];
    /** This reports the selected path, not pixel correctness or frame rate. */
    visualSupportVerified: false;
}
```

### GlassInteraction

Type only · declared in `dist/motion.d.ts`.

```ts
export interface GlassInteraction {
    press: number;
    hover: number;
    pointer: readonly [number, number];
    reducedMotion: boolean;
    illumination?: number;
    illuminationPointer?: readonly [number, number];
}
```

### GlassInteractionController

Type only · declared in `dist/motion.d.ts`.

```ts
export interface GlassInteractionController {
    destroy(): void;
}
```

### glassLightAt

Runtime export · declared in `dist/illumination.d.ts`.

```ts
export declare function glassLightAt(x: number, y: number, width: number, height: number, energy: number, point: readonly [number, number]): number;
```

### GlassMaterial

Type only · declared in `dist/materials.d.ts`.

```ts
export interface GlassMaterial {
    variant: GlassVariant;
    appearance: GlassAppearance;
    tint: readonly [number, number, number, number];
    dimming: number;
    chroma: number;
    blur: number;
    saturation: number;
    brightness: number;
    highlight: number;
    foreground: string;
    opaque: string;
}
```

### GlassOptions

Type only · declared in `dist/types.d.ts`.

```ts
export interface GlassOptions {
    lens: Lens;
    /** Maximum sampling offset in CSS pixels. Default 24; range 0–64. */
    strength?: number;
    /** Refractive index of the single-interface approximation. Default 1.5. */
    ior?: number;
    bevel?: number;
    /** Rim keeps the center flat; dome curves the full lens; concave reverses the bend. */
    surface?: SurfaceProfile;
    /** Relative surface height. 0–4, default 1. */
    depth?: number;
    /** Superellipse surface exponent. 2–8, default 4. */
    curvature?: number;
    blur?: number;
    /** Color diffusion/vibrancy inside the lens. 0–3, default 1. */
    saturation?: number;
    /** Uniform frosting, a frosted center, or a frosted rim with a clear center. */
    blurMode?: BlurMode;
    highlight?: number;
    /** Longest displacement-map side; capped at 512. Independent of DPR. */
    resolution?: number;
    /** Safety budget for the full filtered source, including DPR squared. */
    maxSourcePixels?: number;
    enabled?: boolean;
    /** Force filter-cache invalidation for self-animating DOM. Costs a repaint. */
    live?: boolean;
    respectReducedTransparency?: boolean;
    /** Workaround; 'auto' enables ID refresh in WebKit. */
    refreshFilterId?: 'auto' | 'always' | 'never';
    onStatus?: (diagnostics: GlassDiagnostics) => void;
}
```

### GlassPatch

Type only · declared in `dist/types.d.ts`.

```ts
export type GlassPatch = Partial<Omit<GlassOptions, 'lens'>> & {
    lens?: Partial<Lens>;
};
```

### GlassPreferences

Type only · declared in `dist/materials.d.ts`.

```ts
export interface GlassPreferences {
    reducedMotion: boolean;
    reducedTransparency: boolean;
    increasedContrast: boolean;
    forcedColors: boolean;
    dark: boolean;
}
type Subscriber = (preferences: GlassPreferences) => void;
```

### GlassPresenceController

Type only · declared in `dist/presence.d.ts`.

```ts
export interface GlassPresenceController {
    setVisible(visible: boolean): void;
    getState(): {
        phase: GlassPresencePhase;
        progress: number;
    };
    destroy(): void;
}
```

### glassPresenceFrame

Runtime export · declared in `dist/presence.d.ts`.

```ts
export declare function glassPresenceFrame(progress: number, reducedMotion?: boolean): GlassPresenceFrame;
```

### GlassPresenceFrame

Type only · declared in `dist/presence.d.ts`.

```ts
export interface GlassPresenceFrame {
    progress: number;
    lensing: number;
    diffusion: number;
    material: number;
    edge: number;
    contentOpacity: number;
    contentBlur: number;
    contentScale: number;
}
```

### GlassPresenceOptions

Type only · declared in `dist/presence.d.ts`.

```ts
export interface GlassPresenceOptions {
    visible?: boolean;
    /** Native popovers manage their own display/top layer. */
    manageVisibility?: boolean;
    onFrame?: (frame: GlassPresenceFrame) => void;
    onPhase?: (phase: GlassPresencePhase) => void;
}
```

### GlassPresencePhase

Type only · declared in `dist/presence.d.ts`.

```ts
export type GlassPresencePhase = 'hidden' | 'entering' | 'shown' | 'exiting';
```

### GlassPreset

Type only · declared in `dist/presets.d.ts`.

```ts
export type GlassPreset = GlassSurfacePreset | 'switch' | 'slider' | 'tab' | 'panel';
```

### GlassSurfacePreset

Type only · declared in `dist/surface-presets.d.ts`.

```ts
export type GlassSurfacePreset = 'navigation' | 'toolbar' | 'tab-bar' | 'search' | 'button' | 'floating-action' | 'selection' | 'menu' | 'popover' | 'sidebar' | 'sheet' | 'media' | 'dock' | 'dock-item' | 'alert' | 'action-sheet' | 'notification' | 'chip' | 'widget' | 'control' | 'live-activity' | 'input-accessory' | 'edit-menu' | 'page-control';
```

### glassSurfacePresets

Runtime export · declared in `dist/surface-presets.d.ts`.

```ts
export declare const glassSurfacePresets: Readonly<Record<GlassSurfacePreset, Readonly<GlassSurfaceProfile>>>;
```

### GlassSurfaceProfile

Type only · declared in `dist/surface-presets.d.ts`.

```ts
export interface GlassSurfaceProfile {
    label: string;
    description: string;
    shape: LensShape;
    radius: number;
    bevel: number;
    strength: number;
    depth: number;
    curvature: number;
    diffusion: number;
    elevation: number;
    adaptation: GlassAdaptationPolicy;
    variant: GlassVariant;
    tint?: GlassTint;
    dimming?: number;
    brightness?: number;
}
```

### GlassSurfaceResolution

Type only · declared in `dist/surface-presets.d.ts`.

```ts
export interface GlassSurfaceResolution {
    lens: Lens;
    optics: GlassOptions;
    material: GlassMaterial;
    elevation: number;
    adaptation: GlassAdaptationPolicy;
}
```

### GlassTint

Type only · declared in `dist/materials.d.ts`.

```ts
export type GlassTint = readonly [red: number, green: number, blue: number, opacity: number];
```

### GlassVariant

Type only · declared in `dist/materials.d.ts`.

```ts
export type GlassVariant = 'regular' | 'clear';
```

### Lens

Type only · declared in `dist/optics.d.ts`.

```ts
export interface Lens {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    shape?: LensShape;
}
```

### lensFor

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function lensFor(shape: LensShape, bounds: Omit<Lens, 'shape' | 'radius'> & {
    radius?: number;
}): Lens;
```

### LensShape

Type only · declared in `dist/optics.d.ts`.

```ts
export type LensShape = 'rounded-rect' | 'continuous' | 'circle' | 'capsule' | 'ellipse';
```

### linearChannel

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare const linearChannel: (value: number) => number;
```

### materialOptics

Runtime export · declared in `dist/materials.d.ts`.

```ts
export declare function materialOptics(lens: Lens, variant?: GlassVariant, tintLevel?: number, appearance?: GlassAppearance): GlassOptions;
```

### normalizeGlassTint

Runtime export · declared in `dist/materials.d.ts`.

```ts
export declare function normalizeGlassTint(tint: GlassTint): GlassTint;
```

### observeGlassBackdrop

Runtime export · declared in `dist/backdrop.d.ts`.

```ts
export declare function observeGlassBackdrop(element: HTMLElement, callback: Subscriber['callback'], options?: GlassBackdropOptions): {
    refresh: () => void;
    destroy: () => void;
};
```

### observeGlassPreferences

Runtime export · declared in `dist/materials.d.ts`.

```ts
export declare function observeGlassPreferences(win: Window, callback: Subscriber): () => void;
```

### relativeLuminance

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare const relativeLuminance: (rgb: readonly number[]) => number;
```

### resolveGlassSurface

Runtime export · declared in `dist/surface-presets.d.ts`.

```ts
export declare function resolveGlassSurface(preset: GlassSurfacePreset, bounds: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    radius?: number;
    shape?: LensShape;
}, options?: {
    variant?: GlassVariant;
    appearance?: GlassAppearance;
    tintLevel?: number;
}): GlassSurfaceResolution;
```

### SpringState

Type only · declared in `dist/motion.d.ts`.

```ts
export interface SpringState {
    value: number;
    velocity: number;
}
```

### stepSpring

Runtime export · declared in `dist/motion.d.ts`.

```ts
export declare function stepSpring(state: SpringState, target: number, seconds: number, stiffness?: number, damping?: number): SpringState;
```

### summarizeBackdrop

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare function summarizeBackdrop(colors: readonly (readonly number[])[], source: GlassBackdropSample['source'], confidence?: number): GlassBackdropSample | null;
```

### SurfaceProfile

Type only · declared in `dist/optics.d.ts`.

```ts
export type SurfaceProfile = 'rim' | 'dome' | 'concave';
```

### updateGlassAdaptation

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare function updateGlassAdaptation(previous: GlassAdaptiveState | undefined, sample: GlassBackdropSample | null, now: number, fallback: GlassAppearance, policy?: GlassAdaptationPolicy): GlassAdaptiveState;
```

### validBackdrop

Runtime export · declared in `dist/adaptive.d.ts`.

```ts
export declare function validBackdrop(sample: GlassBackdropSample | null | undefined): sample is GlassBackdropSample;
```

## @meapri/prism-glass/react

Runtime exports (52): `GlassActionSheet`, `GlassAlert`, `GlassAlertDialog`, `GlassBackgroundExtension`, `GlassBadge`, `GlassButton`, `GlassChip`, `GlassColorWell`, `GlassContextMenu`, `GlassControlTile`, `GlassDatePicker`, `GlassDialog`, `GlassDisclosure`, `GlassDock`, `GlassDockItem`, `GlassEditMenu`, `GlassInputAccessory`, `GlassLightGroup`, `GlassListRow`, `GlassLiveActivity`, `GlassMediaScene`, `GlassMenu`, `GlassNavigationBar`, `GlassNotification`, `GlassPageControl`, `GlassPopover`, `GlassPresence`, `GlassProgress`, `GlassProvider`, `GlassPullDownButton`, `GlassScrollArea`, `GlassSearchField`, `GlassSelect`, `GlassSeparator`, `GlassShareSheet`, `GlassSheet`, `GlassSidebar`, `GlassSlider`, `GlassSnippet`, `GlassSource`, `GlassStepper`, `GlassSurface`, `GlassSwitch`, `GlassTabBar`, `GlassTabs`, `GlassTextField`, `GlassToken`, `GlassToolbar`, `GlassWheelPicker`, `GlassWidget`, `MaterialSurface`, `useGlass`.

Types entry: `./dist/react.d.ts`.

### GlassActionSheet

Runtime export · declared in `dist/components/menus.d.ts`.

```ts
export declare function GlassActionSheet({ actions, cancelLabel, className, ...props }: GlassActionSheetProps): import("react").JSX.Element;
```

### GlassActionSheetProps

Type only · declared in `dist/components/menus.d.ts`.

```ts
export interface GlassActionSheetProps extends Omit<GlassMenuProps, 'items' | 'layout' | 'palette'> {
    actions: readonly GlassMenuItem[];
    cancelLabel?: string;
}
```

### GlassAlert

Runtime export · declared in `dist/components/presentation.d.ts`.

```ts
export declare function GlassAlert({ title, message, actions, onAction, stackActions, children, className, ...props }: GlassAlertProps): import("react").JSX.Element;
```

### GlassAlertAction

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassAlertAction {
    label: string;
    onSelect?: () => void;
    intent?: 'default' | 'destructive' | 'cancel';
    disabled?: boolean;
    autoFocus?: boolean;
    close?: boolean;
}
```

### GlassAlertDialog

Runtime export · declared in `dist/components/presentation.d.ts`.

```ts
export declare const GlassAlertDialog: import("react").ForwardRefExoticComponent<GlassAlertDialogProps & import("react").RefAttributes<HTMLDialogElement>>;
```

### GlassAlertDialogProps

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassAlertDialogProps extends Omit<GlassDialogProps, 'role' | 'kind' | 'title'> {
    title: string;
    message?: ReactNode;
    actions: readonly GlassAlertAction[];
    stackActions?: boolean;
}
```

### GlassAlertProps

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassAlertProps extends Omit<GlassSurfaceProps, 'title'> {
    title: string;
    message?: ReactNode;
    actions?: readonly GlassAlertAction[];
    onAction?: (index: number) => void;
    stackActions?: boolean;
}
```

### GlassBackgroundExtension

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassBackgroundExtension({ src, children, className, ...props }: HTMLAttributes<HTMLDivElement> & {
    src: string;
}): import("react").JSX.Element;
```

### GlassBadge

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassBadge({ count, max, dot, children, className, ...props }: GlassBadgeProps): import("react").JSX.Element | null;
```

### GlassBadgeProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    count?: number;
    max?: number;
    dot?: boolean;
}
```

### GlassButton

Runtime export · declared in `dist/components/surface.d.ts`.

```ts
export declare const GlassButton: import("react").ForwardRefExoticComponent<GlassButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
```

### GlassButtonProps

Type only · declared in `dist/components/surface.d.ts`.

```ts
export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, MaterialProps {
    shape?: 'capsule' | 'rounded-rect' | 'continuous' | 'circle';
    radius?: number;
    size?: 'small' | 'regular' | 'large' | 'extra-large';
    emphasis?: 'glass' | 'prominent' | 'plain' | 'bordered';
    intent?: 'default' | 'destructive';
    loading?: boolean;
    icon?: ReactNode;
}
```

### GlassChip

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare const GlassChip: import("react").ForwardRefExoticComponent<GlassChipProps & import("react").RefAttributes<HTMLButtonElement>>;
```

### GlassChipProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassChipProps extends Omit<GlassButtonProps, 'shape' | 'aria-pressed'> {
    selected?: boolean;
    defaultSelected?: boolean;
    onSelectedChange?: (selected: boolean) => void;
}
```

### GlassColorWell

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare const GlassColorWell: import("react").ForwardRefExoticComponent<GlassColorWellProps & import("react").RefAttributes<HTMLInputElement>>;
```

### GlassColorWellProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassColorWellProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'defaultValue'> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label?: string;
}
```

### GlassContextMenu

Runtime export · declared in `dist/components/menus.d.ts`.

```ts
export declare function GlassContextMenu({ children, items, label, layout, palette, onSelect, className, onContextMenu, onKeyDown, onPointerDown, onPointerUp, onPointerMove, onPointerCancel, ...props }: GlassContextMenuProps): import("react").JSX.Element;
```

### GlassContextMenuProps

Type only · declared in `dist/components/menus.d.ts`.

```ts
export interface GlassContextMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    items: readonly GlassMenuItem[];
    label?: string;
    layout?: GlassMenuProps['layout'];
    palette?: readonly GlassMenuItem[];
    onSelect?: (id: string) => void;
}
```

### GlassControlTile

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare const GlassControlTile: import("react").ForwardRefExoticComponent<GlassControlTileProps & import("react").RefAttributes<HTMLButtonElement>>;
```

### GlassControlTileProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassControlTileProps extends Omit<GlassButtonProps, 'size' | 'aria-pressed'> {
    size?: 'small' | 'wide' | 'large';
    selected?: boolean;
    defaultSelected?: boolean;
    onSelectedChange?: (selected: boolean) => void;
    label: string;
    subtitle?: string;
    symbol?: ReactNode;
}
```

### GlassDatePicker

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare function GlassDatePicker({ value: controlled, defaultValue, onValueChange, min, max, disabled, label, locale, display, className, ...props }: GlassDatePickerProps): import("react").JSX.Element;
```

### GlassDatePickerProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassDatePickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    min?: string;
    max?: string;
    disabled?: boolean;
    label?: string;
    locale?: string;
    display?: 'compact' | 'inline';
}
```

### GlassDialog

Runtime export · declared in `dist/components/presentation.d.ts`.

```ts
export declare const GlassDialog: import("react").ForwardRefExoticComponent<GlassDialogProps & import("react").RefAttributes<HTMLDialogElement>>;
```

### GlassDialogProps

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassDialogProps extends Omit<GlassSurfaceProps, 'title' | 'role' | 'present' | 'local'> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role?: 'dialog' | 'alertdialog';
    dismissible?: boolean;
    dismissOnBackdrop?: boolean;
    kind?: 'dialog' | 'sheet';
    initialFocusRef?: RefObject<HTMLElement | null>;
    returnFocusRef?: RefObject<HTMLElement | null>;
    dialogStyle?: CSSProperties;
    dialogClassName?: string;
    source?: RefObject<GlassMediaSource | null>;
    sourceVersion?: string | number;
}
```

### GlassDisclosure

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassDisclosure({ title, open: controlled, defaultOpen, onOpenChange, children, className, ...props }: GlassDisclosureProps): import("react").JSX.Element;
```

### GlassDisclosureProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassDisclosureProps extends Omit<HTMLAttributes<HTMLDetailsElement>, 'onToggle' | 'title'> {
    title: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}
```

### GlassDock

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassDock({ children, className, variant, dimming, tint, ...props }: GlassSurfaceProps): import("react").JSX.Element;
```

### GlassDockItem

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare const GlassDockItem: import("react").ForwardRefExoticComponent<GlassDockItemProps & import("react").RefAttributes<HTMLButtonElement>>;
```

### GlassDockItemProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassDockItemProps extends GlassButtonProps {
    badge?: number;
    label: string;
}
```

### GlassEditMenu

Runtime export · declared in `dist/components/menus.d.ts`.

```ts
export declare function GlassEditMenu(props: GlassMenuProps): import("react").JSX.Element;
```

### GlassInputAccessory

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassInputAccessory({ children, className, ...props }: GlassSurfaceProps): import("react").JSX.Element;
```

### GlassLightGroup

Runtime export · declared in `dist/components/presence.d.ts`.

```ts
export declare function GlassLightGroup(props: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
```

### GlassListRow

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassListRow({ children, detail, chevron, className, ...props }: HTMLAttributes<HTMLDivElement> & {
    detail?: ReactNode;
    chevron?: boolean;
}): import("react").JSX.Element;
```

### GlassLiveActivity

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassLiveActivity({ presentation, leading, trailing, label, children, className, tint, ...props }: GlassLiveActivityProps): import("react").JSX.Element;
```

### GlassLiveActivityProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassLiveActivityProps extends GlassSurfaceProps {
    presentation?: 'banner' | 'compact' | 'minimal' | 'expanded';
    leading?: ReactNode;
    trailing?: ReactNode;
    label?: string;
}
```

### GlassMediaScene

Runtime export · declared in `dist/components/media-scene.d.ts`.

```ts
export declare function GlassMediaScene({ source, sourceVersion, media, variant, appearance, tintLevel, dimming, tint, children, className, style, ...props }: GlassMediaSceneProps): import("react").JSX.Element;
```

### GlassMediaSceneProps

Type only · declared in `dist/components/media-scene.d.ts`.

```ts
export interface GlassMediaSceneProps extends HTMLAttributes<HTMLDivElement>, Pick<MaterialProps, 'variant' | 'appearance' | 'tintLevel' | 'dimming' | 'tint'> {
    source: RefObject<GlassMediaSource | null>;
    /** Increment after repainting a static canvas source. */
    sourceVersion?: string | number;
    media?: Omit<MediaGlassOptions, 'lenses'>;
}
```

### GlassMenu

Runtime export · declared in `dist/components/menus.d.ts`.

```ts
export declare function GlassMenu({ items, title, layout, palette, onSelect, orientation, className, onOpenChange, open: controlled, ...props }: GlassMenuProps): import("react").JSX.Element;
```

### GlassMenuItem

Type only · declared in `dist/components/menus.d.ts`.

```ts
export interface GlassMenuItem {
    id: string;
    label: string;
    icon?: ReactNode;
    detail?: string;
    shortcut?: string;
    disabled?: boolean;
    destructive?: boolean;
    checked?: boolean;
    kind?: 'action' | 'checkbox' | 'radio';
    separatorBefore?: boolean;
    keepOpen?: boolean;
    onSelect?: () => void;
    items?: readonly GlassMenuItem[];
}
```

### GlassMenuProps

Type only · declared in `dist/components/menus.d.ts`.

```ts
export interface GlassMenuProps extends Omit<GlassPopoverProps, 'children' | 'onSelect'> {
    items: readonly GlassMenuItem[];
    title?: string;
    layout?: 'large' | 'medium' | 'small';
    palette?: readonly GlassMenuItem[];
    onSelect?: (id: string) => void;
    orientation?: 'vertical' | 'horizontal';
}
```

### GlassNavigationBar

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassNavigationBar({ title, largeTitle, leading, trailing, subtitle, children, className, variant, appearance, tintLevel, dimming, tint, preset, backdrop, refractionTarget, optics, present, onPresenceChange, ...props }: GlassNavigationBarProps): import("react").JSX.Element;
```

### GlassNavigationBarProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassNavigationBarProps extends HTMLAttributes<HTMLElement>, MaterialProps {
    title: string;
    largeTitle?: boolean;
    leading?: ReactNode;
    trailing?: ReactNode;
    subtitle?: string;
    children?: ReactNode;
}
```

### GlassNotification

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassNotification({ title, message, appName, icon, time, onActivate, onDismiss, actions, expanded, className, ...props }: GlassNotificationProps): import("react").JSX.Element;
```

### GlassNotificationAction

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassNotificationAction {
    id: string;
    label: string;
    onSelect: () => void;
    destructive?: boolean;
    disabled?: boolean;
}
```

### GlassNotificationProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassNotificationProps extends Omit<GlassSurfaceProps, 'title'> {
    title: string;
    message: ReactNode;
    appName?: string;
    icon?: ReactNode;
    time?: string;
    onActivate?: () => void;
    onDismiss?: () => void;
    actions?: readonly GlassNotificationAction[];
    expanded?: boolean;
}
```

### GlassPageControl

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare function GlassPageControl({ count, value: controlled, defaultValue, onValueChange, background, appearance, variant, tint, dimming, className, style, ...props }: GlassPageControlProps): import("react").JSX.Element;
```

### GlassPageControlProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassPageControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>, Pick<MaterialProps, 'appearance' | 'variant' | 'tint' | 'dimming'> {
    count: number;
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    background?: 'automatic' | 'prominent' | 'minimal';
}
```

### GlassPickerOption

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassPickerOption {
    value: string;
    label: string;
    disabled?: boolean;
}
```

### GlassPopover

Runtime export · declared in `dist/components/popover.d.ts`.

```ts
export declare function GlassPopover({ trigger, triggerLabel, children, onOpenChange, open: controlled, triggerProps, anchorRef, anchorPoint, align, placement, source, sourceVersion, className, ...props }: GlassPopoverProps): import("react").JSX.Element;
```

### GlassPopoverProps

Type only · declared in `dist/components/popover.d.ts`.

```ts
export interface GlassPopoverProps extends Omit<GlassSurfaceProps, 'children' | 'title' | 'onToggle' | 'present'> {
    trigger: ReactNode;
    children: ReactNode;
    /** Accessible name for an icon-only trigger. */
    triggerLabel?: string;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
    triggerProps?: GlassButtonProps;
    anchorRef?: RefObject<HTMLElement | null>;
    anchorPoint?: {
        x: number;
        y: number;
    };
    align?: 'start' | 'center' | 'end';
    placement?: 'below' | 'overlap';
    source?: RefObject<GlassMediaSource | null>;
    sourceVersion?: string | number;
}
```

### GlassPresence

Runtime export · declared in `dist/components/presence.d.ts`.

```ts
export declare const GlassPresence: import("react").ForwardRefExoticComponent<GlassSurfaceProps & {
    present: boolean;
} & import("react").RefAttributes<HTMLDivElement>>;
```

### GlassProgress

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassProgress({ value, max, size, label, kind, className, style, ...props }: GlassProgressProps): import("react").JSX.Element;
```

### GlassProgressProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    value?: number;
    max?: number;
    size?: 'small' | 'regular';
    label?: string;
    kind?: 'linear' | 'circular';
}
```

### GlassProvider

Runtime export · declared in `dist/components/context.d.ts`.

```ts
export declare function GlassProvider({ children, variant, appearance, tintLevel, dimming, tint }: GlassProviderProps): import("react").JSX.Element;
```

### GlassProviderProps

Type only · declared in `dist/components/context.d.ts`.

```ts
export interface GlassProviderProps {
    children: ReactNode;
    variant?: GlassVariant;
    appearance?: GlassAppearanceMode;
    tintLevel?: number;
    dimming?: number;
    tint?: GlassTint;
}
```

### GlassPullDownButton

Runtime export · declared in `dist/components/menus.d.ts`.

```ts
export declare function GlassPullDownButton(props: GlassMenuProps): import("react").JSX.Element;
```

### GlassScrollArea

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare const GlassScrollArea: import("react").ForwardRefExoticComponent<GlassScrollAreaProps & import("react").RefAttributes<HTMLDivElement>>;
```

### GlassScrollAreaProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
    edgeEffect?: 'soft' | 'hard' | 'none';
}
```

### GlassSearchField

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare const GlassSearchField: import("react").ForwardRefExoticComponent<GlassSearchFieldProps & import("react").RefAttributes<HTMLInputElement>>;
```

### GlassSearchFieldProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassSearchFieldProps extends Omit<GlassTextFieldProps, 'type' | 'leading' | 'trailing' | 'error'>, Omit<MaterialProps, 'appearance'> {
    onSearch?: (value: string) => void;
    onCancel?: () => void;
    cancelLabel?: string;
    cancelable?: boolean;
    floating?: boolean;
}
```

### GlassSelect

Runtime export · declared in `dist/components/menus.d.ts`.

```ts
export declare function GlassSelect({ options, value: controlled, defaultValue, onValueChange, disabled, label, triggerProps, ...props }: GlassSelectProps): import("react").JSX.Element;
```

### GlassSelectProps

Type only · declared in `dist/components/menus.d.ts`.

```ts
export interface GlassSelectProps extends Omit<GlassMenuProps, 'items' | 'trigger' | 'onSelect'> {
    options: readonly GlassPickerOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    label?: string;
}
```

### GlassSeparator

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassSeparator({ className, ...props }: HTMLAttributes<HTMLHRElement>): import("react").JSX.Element;
```

### GlassShareItem

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassShareItem {
    id: string;
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    disabled?: boolean;
}
```

### GlassShareSheet

Runtime export · declared in `dist/components/presentation.d.ts`.

```ts
export declare function GlassShareSheet({ title, subtitle, preview, destinations, actions, url, children, onOpenChange, ...props }: GlassShareSheetProps): import("react").JSX.Element;
```

### GlassShareSheetProps

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassShareSheetProps extends Omit<GlassSheetProps, 'title'> {
    title: string;
    subtitle?: string;
    preview?: ReactNode;
    destinations?: readonly GlassShareItem[];
    actions?: readonly GlassShareItem[];
    url?: string;
}
```

### GlassSheet

Runtime export · declared in `dist/components/presentation.d.ts`.

```ts
export declare const GlassSheet: import("react").ForwardRefExoticComponent<GlassSheetProps & import("react").RefAttributes<HTMLDialogElement>>;
```

### GlassSheetDetent

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export type GlassSheetDetent = 'medium' | 'large' | number;
```

### GlassSheetProps

Type only · declared in `dist/components/presentation.d.ts`.

```ts
export interface GlassSheetProps extends Omit<GlassDialogProps, 'kind' | 'title'> {
    title?: string;
    detents?: readonly GlassSheetDetent[];
    detent?: GlassSheetDetent;
    defaultDetent?: GlassSheetDetent;
    onDetentChange?: (detent: GlassSheetDetent) => void;
    leading?: ReactNode;
    trailing?: ReactNode;
    showGrabber?: boolean;
}
```

### GlassSidebar

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassSidebar({ items, value: controlled, defaultValue, onValueChange, heading, className, ...props }: GlassSidebarProps): import("react").JSX.Element;
```

### GlassSidebarItem

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassSidebarItem {
    value: string;
    label: string;
    icon?: ReactNode;
    badge?: number;
    disabled?: boolean;
}
```

### GlassSidebarProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassSidebarProps extends GlassSurfaceProps {
    items: readonly GlassSidebarItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    heading?: string;
}
```

### GlassSlider

Runtime export · declared in `dist/components/controls.d.ts`.

```ts
export declare const GlassSlider: import("react").ForwardRefExoticComponent<GlassSliderProps & import("react").RefAttributes<HTMLInputElement>>;
```

### GlassSliderProps

Type only · declared in `dist/components/controls.d.ts`.

```ts
export interface GlassSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'>, Omit<MaterialProps, 'refractionTarget' | 'preset' | 'backdrop' | 'present' | 'onPresenceChange'> {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
}
```

### GlassSnippet

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassSnippet({ children, className, ...props }: GlassSurfaceProps): import("react").JSX.Element;
```

### GlassSource

Runtime export · declared in `dist/react.d.ts`.

```ts
export declare const GlassSource: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & {
    glass: GlassOptions;
} & import("react").RefAttributes<HTMLDivElement>>;
```

### GlassSourceProps

Type only · declared in `dist/react.d.ts`.

```ts
export type GlassSourceProps = HTMLAttributes<HTMLDivElement> & {
    glass: GlassOptions;
};
```

### GlassStepper

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare function GlassStepper({ value: controlled, defaultValue, onValueChange, min, max, step, disabled, label, className, onKeyDown, ...props }: GlassStepperProps): import("react").JSX.Element;
```

### GlassStepperProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassStepperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    label?: string;
}
```

### GlassSurface

Runtime export · declared in `dist/components/surface.d.ts`.

```ts
export declare const GlassSurface: import("react").ForwardRefExoticComponent<GlassSurfaceProps & import("react").RefAttributes<HTMLDivElement>>;
```

### GlassSurfaceProps

Type only · declared in `dist/components/surface.d.ts`.

```ts
export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement>, MaterialProps {
    shape?: LensShape;
    radius?: number;
    /** Keep top-layer surfaces (for example popovers) independent of a media scene. */
    local?: boolean;
}
```

### GlassSwitch

Runtime export · declared in `dist/components/controls.d.ts`.

```ts
export declare const GlassSwitch: import("react").ForwardRefExoticComponent<GlassSwitchProps & import("react").RefAttributes<HTMLButtonElement>>;
```

### GlassSwitchProps

Type only · declared in `dist/components/controls.d.ts`.

```ts
export interface GlassSwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'>, Omit<MaterialProps, 'refractionTarget' | 'preset' | 'backdrop' | 'present' | 'onPresenceChange'> {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    value?: string;
}
```

### GlassTab

Type only · declared in `dist/components/tabs.d.ts`.

```ts
export interface GlassTab {
    value: string;
    label: ReactNode;
    content?: ReactNode;
    disabled?: boolean;
}
```

### GlassTabBar

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassTabBar({ items, value: controlled, defaultValue, onValueChange, minimized, accessory, className, ...props }: GlassTabBarProps): import("react").JSX.Element;
```

### GlassTabBarItem

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassTabBarItem {
    value: string;
    label: string;
    icon: ReactNode;
    badge?: number;
    disabled?: boolean;
}
```

### GlassTabBarProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassTabBarProps extends GlassSurfaceProps {
    items: readonly GlassTabBarItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    minimized?: boolean;
    accessory?: ReactNode;
}
```

### GlassTabs

Runtime export · declared in `dist/components/tabs.d.ts`.

```ts
export declare function GlassTabs({ items, value: controlled, defaultValue, onValueChange, variant, appearance, optics, tintLevel, dimming, tint, className, ...props }: GlassTabsProps): import("react").JSX.Element;
```

### GlassTabsProps

Type only · declared in `dist/components/tabs.d.ts`.

```ts
export interface GlassTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>, Omit<MaterialProps, 'refractionTarget' | 'preset' | 'backdrop' | 'present' | 'onPresenceChange'> {
    items: readonly GlassTab[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}
```

### GlassTextField

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare const GlassTextField: import("react").ForwardRefExoticComponent<GlassTextFieldProps & import("react").RefAttributes<HTMLInputElement>>;
```

### GlassTextFieldProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassTextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue'>, Pick<MaterialProps, 'appearance'> {
    label?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    clearable?: boolean;
    leading?: ReactNode;
    trailing?: ReactNode;
    error?: string;
}
```

### GlassToken

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassToken({ children, onRemove, removeLabel, disabled, className, ...props }: GlassTokenProps): import("react").JSX.Element;
```

### GlassTokenProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassTokenProps extends GlassSurfaceProps {
    onRemove?: () => void;
    removeLabel?: string;
    disabled?: boolean;
}
```

### GlassToolbar

Runtime export · declared in `dist/components/surface.d.ts`.

```ts
export declare const GlassToolbar: import("react").ForwardRefExoticComponent<GlassSurfaceProps & import("react").RefAttributes<HTMLDivElement>>;
```

### GlassWheelPicker

Runtime export · declared in `dist/components/inputs.d.ts`.

```ts
export declare function GlassWheelPicker({ options, value: controlled, defaultValue, onValueChange, disabled, label, className, style, ...props }: GlassWheelPickerProps): import("react").JSX.Element;
```

### GlassWheelPickerProps

Type only · declared in `dist/components/inputs.d.ts`.

```ts
export interface GlassWheelPickerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
    options: readonly GlassPickerOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    label: string;
}
```

### GlassWidget

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare function GlassWidget({ size, renderingMode, accent, children, className, ...props }: GlassWidgetProps): import("react").JSX.Element;
```

### GlassWidgetProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface GlassWidgetProps extends GlassSurfaceProps {
    size?: 'small' | 'medium' | 'large';
    renderingMode?: 'full-color' | 'clear' | 'tinted';
    accent?: readonly [number, number, number];
}
```

### MaterialProps

Type only · declared in `dist/components/context.d.ts`.

```ts
export interface MaterialProps {
    variant?: GlassVariant;
    appearance?: GlassAppearanceMode;
    preset?: GlassSurfacePreset;
    /** Explicit backdrop source or read-only sample callback for unsupported compositing. */
    backdrop?: Element | GlassBackdropReader;
    tintLevel?: number;
    /** Clear material's local background darkening, 0–1. 0 keeps the clearest view; default 0.35. */
    dimming?: number;
    /** Optional material reflection/tint. Normalized RGBA; foreground remains opaque. */
    tint?: GlassTint;
    /** Explicit, decorative source pixels. With no source, the surface uses CSS material. */
    refractionTarget?: ReactNode;
    /** Keep mounted during materialization; false removes hit/focus access immediately. */
    present?: boolean;
    onPresenceChange?: (phase: GlassPresencePhase) => void;
    optics?: Partial<Omit<GlassOptions, 'lens' | 'onStatus'>>;
}
```

### MaterialSurface

Runtime export · declared in `dist/components/primitives.d.ts`.

```ts
export declare const MaterialSurface: import("react").ForwardRefExoticComponent<MaterialSurfaceProps & import("react").RefAttributes<HTMLDivElement>>;
```

### MaterialSurfaceProps

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export interface MaterialSurfaceProps extends HTMLAttributes<HTMLDivElement>, Pick<MaterialProps, 'appearance'> {
    material?: StandardMaterial;
}
```

### StandardMaterial

Type only · declared in `dist/components/primitives.d.ts`.

```ts
export type StandardMaterial = 'ultra-thin' | 'thin' | 'regular' | 'thick';
```

### useGlass

Runtime export · declared in `dist/react.d.ts`.

```ts
export declare function useGlass(source: RefObject<HTMLElement | null>, options: GlassOptions): RefObject<GlassController | null>;
```

## @meapri/prism-glass/optics

Runtime exports (8): `clamp`, `continuousContour`, `finite`, `generateMaps`, `lensFor`, `normalizeLens`, `roundedDistance`, `sampleDisplacement`.

Types entry: `./dist/optics.d.ts`.

### BlurMode

Type only · declared in `dist/optics.d.ts`.

```ts
export type BlurMode = 'uniform' | 'center' | 'edge';
```

### clamp

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare const clamp: (n: number, a: number, b: number) => number;
```

### continuousContour

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function continuousContour(lens: Lens, inset?: number): string;
```

### finite

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function finite(value: number, name: string): number;
```

### generateMaps

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function generateMaps(input: OpticalShape, resolution?: number): PixelMaps;
```

### Lens

Type only · declared in `dist/optics.d.ts`.

```ts
export interface Lens {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    shape?: LensShape;
}
```

### lensFor

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function lensFor(shape: LensShape, bounds: Omit<Lens, 'shape' | 'radius'> & {
    radius?: number;
}): Lens;
```

### LensShape

Type only · declared in `dist/optics.d.ts`.

```ts
export type LensShape = 'rounded-rect' | 'continuous' | 'circle' | 'capsule' | 'ellipse';
```

### normalizeLens

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function normalizeLens(lens: Lens): Lens;
```

### OpticalShape

Type only · declared in `dist/optics.d.ts`.

```ts
export interface OpticalShape {
    width: number;
    height: number;
    radius: number;
    bevel: number;
    ior: number;
    shape?: LensShape;
    surface?: SurfaceProfile;
    depth?: number;
    curvature?: number;
    blurMode?: BlurMode;
}
```

### PixelMaps

Type only · declared in `dist/optics.d.ts`.

```ts
export interface PixelMaps {
    width: number;
    height: number;
    displacement: Uint8ClampedArray;
    mask: Uint8ClampedArray;
    highlight: Uint8ClampedArray;
    frost?: Uint8ClampedArray;
}
```

### roundedDistance

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function roundedDistance(x: number, y: number, shape: OpticalShape): number;
```

### sampleDisplacement

Runtime export · declared in `dist/optics.d.ts`.

```ts
export declare function sampleDisplacement(x: number, y: number, shape: OpticalShape): {
    dx: number;
    dy: number;
    mask: number;
    shine: number;
    frost: number;
};
```

### SurfaceProfile

Type only · declared in `dist/optics.d.ts`.

```ts
export type SurfaceProfile = 'rim' | 'dome' | 'concave';
```

## @meapri/prism-glass/media

Runtime exports (2): `createMediaGlass`, `generateMediaMaps`.

Types entry: `./dist/media.d.ts`.

### createMediaGlass

Runtime export · declared in `dist/media.d.ts`.

```ts
export declare function createMediaGlass(canvas: HTMLCanvasElement, source: GlassMediaSource, options?: MediaGlassOptions): MediaGlassController;
```

### generateMediaMaps

Runtime export · declared in `dist/media-maps.d.ts`.

```ts
export declare function generateMediaMaps(input: OpticalShape, resolution?: number, pixelRatio?: number): MediaPixelMaps;
```

### GlassMediaSource

Type only · declared in `dist/media-types.d.ts`.

```ts
export type GlassMediaSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
```

### MediaGlassController

Type only · declared in `dist/media-types.d.ts`.

```ts
export interface MediaGlassController {
    setLenses(lenses: readonly MediaLens[]): void;
    updateLens(id: string, patch: MediaLensPatch): void;
    update(patch: Partial<Omit<MediaGlassOptions, 'lenses'>>): void;
    refresh(): void;
    getDiagnostics(): MediaGlassDiagnostics;
    destroy(): void;
}
```

### MediaGlassDiagnostics

Type only · declared in `dist/media-types.d.ts`.

```ts
export interface MediaGlassDiagnostics {
    state: 'loading' | 'ready' | 'paused' | 'disabled' | 'fallback' | 'error' | 'destroyed';
    reason: string;
    renderer: 'webgl-media';
    lenses: number;
    mapBuilds: number;
    textureUploads: number;
    renders: number;
    pixels: number;
    /** Total currently allocated optical-field pixels (two RGBA textures per pixel). */
    mapPixels: number;
    mapPrecision: 16;
    visualSupportVerified: false;
}
```

### MediaGlassOptions

Type only · declared in `dist/media-types.d.ts`.

```ts
export interface MediaGlassOptions {
    lenses?: readonly MediaLens[];
    fit?: 'cover' | 'contain' | 'fill';
    /** Align a separate optical plane (for example a dialog) to the source element's page bounds. */
    sourceAlignment?: 'scene' | 'element';
    /** Align with the visible media's object-position, normalized 0–1. */
    position?: readonly [number, number];
    /** RGB channels in 0–1, matching the visible media's background/letterbox. Default black. */
    backgroundColor?: readonly [number, number, number];
    /** Longest optical field side: default 1024, maximum 2048. Adapts to DPR and a shared 4M-pixel budget. */
    resolution?: number;
    /** Maximum backing-store DPR. Defaults to the display DPR, capped at 3. */
    pixelRatio?: number;
    maxPixels?: number;
    enabled?: boolean;
    /** Repaint self-animating canvas sources; video uses frame callbacks automatically. */
    live?: boolean;
    respectPreferences?: boolean;
    onStatus?: (diagnostics: MediaGlassDiagnostics) => void;
}
```

### MediaLens

Type only · declared in `dist/media-types.d.ts`.

```ts
export interface MediaLens {
    id: string;
    lens: Lens;
    variant?: GlassVariant;
    appearance?: GlassAppearanceMode;
    fallbackAppearance?: GlassAppearance;
    preset?: GlassSurfacePreset;
    /** Called outside React render; use to keep foreground and GPU appearance together. */
    onAppearance?: (state: {
        appearance: GlassAppearance;
        material: GlassMaterial;
        elevation: number;
        available: boolean;
        separation: number;
        ambient?: readonly [number, number, number];
    }) => void;
    /** Web analogue of the iOS 27 appearance preference: 0 clearer, 1 more tinted. */
    tintLevel?: number;
    tint?: GlassTint;
    strength?: number;
    bevel?: number;
    ior?: number;
    surface?: SurfaceProfile;
    depth?: number;
    curvature?: number;
    blurMode?: BlurMode;
    blur?: number;
    saturation?: number;
    highlight?: number;
    /** Chromatic fringe in CSS pixels, 0–3. */
    chroma?: number;
    /** Local dimming under clear controls; defaults to 0.35. Set 0 for already-dark media. */
    dimming?: number;
    /** Touch lighting, 0–1. Changes do not rebuild the optical map. */
    press?: number;
    /** Neighboring contact illumination, 0–1. */
    illumination?: number;
    illuminationPointer?: readonly [number, number];
    /** Material formation, 0 invisible/optically neutral to 1 fully formed. */
    presence?: number;
    hover?: number;
    pointer?: readonly [number, number];
}
```

### MediaLensPatch

Type only · declared in `dist/media-types.d.ts`.

```ts
export type MediaLensPatch = Partial<Omit<MediaLens, 'id' | 'lens'>> & {
    lens?: Partial<Lens>;
};
```

### MediaPixelMaps

Type only · declared in `dist/media-maps.d.ts`.

```ts
export interface MediaPixelMaps {
    width: number;
    height: number;
    precision: 16;
    displacement: Uint8Array;
    finish: Uint8Array;
}
```
