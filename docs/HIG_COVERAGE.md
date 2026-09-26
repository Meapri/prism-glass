# iOS 27 component coverage

Reviewed 2026-09-25 against [Apple's HIG Components index](https://developer.apple.com/design/human-interface-guidelines/components). Version 0.5.0-alpha.1 includes the complete 64-entry inventory: 30 iOS component entries, 13 standard-content entries, 3 OS-owned integrations and 18 entries for other Apple platforms. The [interactive catalog](https://meapri.github.io/prism-glass/catalog.html) contains every entry and four additional compositions/foundations.

## What is implemented

React controls provide their actual browser interaction: toggles, ranges, tabs, stepper hold/repeat, page selection/scrubbing, wheel and calendar selection, text/search entry, menus with disabled/checked/submenu states, context menus, native top-layer popovers, modal alerts, detented sheets and share-sheet callbacks. Custom chips, notifications, widgets, Control Center tiles and Live Activities are in-page compositions. They do not register native widgets, Control Center controls, push delivery, app shortcuts or system activities. Home-screen quick actions use an in-page context-menu preview; native registration remains the application's responsibility.

Standard materials stay in the content plane without optical refraction. Charts, images, text, web content and collections use semantic HTML/application content. They are not additional proprietary chart or web-view engines. Items defined only on other Apple platforms remain explicitly outside this iOS library.

## Reference and fidelity

- Native source: [NativeCatalogReference.swift](https://github.com/Meapri/prism-glass/blob/main/docs/visual/NativeCatalogReference.swift), Xcode 27.0, iOS 27.0 simulator. Reference scenes use real SwiftUI controls and the same CC0 source frame. Captures are cropped below the system status bar to 402 × 812 CSS pixels.
- Native light/dark photo captures cover buttons, input controls, wheel/calendar, navigation/toolbars, tab bars, alerts, action sheets, popovers, sheets, menus and standard materials. The reference column shows the native base state; switching live states does not imply a matching native capture exists for every combination. A manifest prevents fabricated or missing image references.
- Native layer geometry informed button sizes, visual/hit-box separation, continuous corners, alert dimensions, menu placement and sheet layout. Continuous corners use a fitted generalized rounded rectangle, not Apple's private path generator.
- The Clear dock follows the user's transparency reference: 0 local dimming, a 3.5% white reflection, broad refraction and thin edge lighting. The runtime uses generic icons.
- Media displacement uses packed 16-bit coordinates, display-aware sampling (1024px default cap, 2048px configurable cap), DPR up to 3 and a shared 4M-pixel field budget. The SVG path retains its portable 8-bit map representation.
- Remaining differences: SF Symbols versus Lucide glyphs, native/local color vibrancy, OS-managed glass unions, advanced native transition choreography, platform keyboard/calendar chrome and physical-device GPU performance. These limits prevent a claim of pixel identity across all HIG states.

## Component inventory

| HIG entry | Scope | Web API / integration | Live states | Native family reference |
| --- | --- | --- | --- | --- |
| [Charts](https://developer.apple.com/design/human-interface-guidelines/charts) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Image views](https://developer.apple.com/design/human-interface-guidelines/image-views) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Text views](https://developer.apple.com/design/human-interface-guidelines/text-views) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Web views](https://developer.apple.com/design/human-interface-guidelines/web-views) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Boxes](https://developer.apple.com/design/human-interface-guidelines/boxes) | Standard content | MaterialSurface + semantic content | default | standard-materials |
| [Collections](https://developer.apple.com/design/human-interface-guidelines/collections) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Column views](https://developer.apple.com/design/human-interface-guidelines/column-views) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls) | Standard content | GlassDisclosure | default, expanded | Shared material / guideline only |
| [Labels](https://developer.apple.com/design/human-interface-guidelines/labels) | Standard content | MaterialSurface + semantic content | default | standard-materials |
| [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Lockups](https://developer.apple.com/design/human-interface-guidelines/lockups) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Outline views](https://developer.apple.com/design/human-interface-guidelines/outline-views) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Split views](https://developer.apple.com/design/human-interface-guidelines/split-views) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Tab views](https://developer.apple.com/design/human-interface-guidelines/tab-views) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Activity views](https://developer.apple.com/design/human-interface-guidelines/activity-views) | iOS component | GlassShareSheet | open, expanded, closed | Shared material / guideline only |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | iOS component | GlassButton | default, pressed, disabled, loading | buttons |
| [Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus) | iOS component | GlassContextMenu | open, closed | menus |
| [Dock menus](https://developer.apple.com/design/human-interface-guidelines/dock-menus) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Edit menus](https://developer.apple.com/design/human-interface-guidelines/edit-menus) | iOS component | GlassEditMenu | open, closed | Shared material / guideline only |
| [Home Screen quick actions](https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions) | iOS component | GlassContextMenu | open, closed | Shared material / guideline only |
| [Menus](https://developer.apple.com/design/human-interface-guidelines/menus) | iOS component | GlassMenu | open, closed | menus |
| [Ornaments](https://developer.apple.com/design/human-interface-guidelines/ornaments) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons) | iOS component | GlassSelect | default, disabled | inputs |
| [Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons) | iOS component | GlassPullDownButton | open, closed | menus |
| [The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) | iOS component | GlassToolbar / GlassNavigationBar | default | navigation |
| [Path controls](https://developer.apple.com/design/human-interface-guidelines/path-controls) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields) | iOS component | GlassSearchField | default, disabled | Shared material / guideline only |
| [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) | iOS component | GlassSidebar | default | Shared material / guideline only |
| [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | iOS component | GlassTabBar | default, selected, minimized | tabs |
| [Token fields](https://developer.apple.com/design/human-interface-guidelines/token-fields) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Action sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets) | iOS component | GlassActionSheet | open, closed | action-sheet |
| [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts) | iOS component | GlassAlertDialog | open, closed | alert |
| [Page controls](https://developer.apple.com/design/human-interface-guidelines/page-controls) | iOS component | GlassPageControl | default | inputs |
| [Panels](https://developer.apple.com/design/human-interface-guidelines/panels) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Popovers](https://developer.apple.com/design/human-interface-guidelines/popovers) | iOS component | GlassPopover | open, closed | popover |
| [Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views) | iOS component | GlassScrollArea | default | Shared material / guideline only |
| [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | iOS component | GlassSheet | open, expanded, closed | sheet |
| [Windows](https://developer.apple.com/design/human-interface-guidelines/windows) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Color wells](https://developer.apple.com/design/human-interface-guidelines/color-wells) | iOS component | GlassColorWell | default, disabled | inputs |
| [Combo boxes](https://developer.apple.com/design/human-interface-guidelines/combo-boxes) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Digit entry views](https://developer.apple.com/design/human-interface-guidelines/digit-entry-views) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Image wells](https://developer.apple.com/design/human-interface-guidelines/image-wells) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers) | iOS component | GlassWheelPicker / GlassDatePicker | default, disabled | wheel |
| [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) | iOS component | GlassTabs | default | inputs |
| [Sliders](https://developer.apple.com/design/human-interface-guidelines/sliders) | iOS component | GlassSlider | default, disabled | inputs |
| [Steppers](https://developer.apple.com/design/human-interface-guidelines/steppers) | iOS component | GlassStepper | default, disabled | inputs |
| [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) | iOS component | GlassTextField | default, disabled | inputs |
| [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) | iOS component | GlassSwitch | default, disabled | inputs |
| [Virtual keyboards](https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards) | OS integration | GlassTextField / GlassInputAccessory | default | Shared material / guideline only |
| [Activity rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Gauges](https://developer.apple.com/design/human-interface-guidelines/gauges) | Standard content | MaterialSurface + semantic content | default | Shared material / guideline only |
| [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) | Standard content | GlassProgress | default | inputs |
| [Rating indicators](https://developer.apple.com/design/human-interface-guidelines/rating-indicators) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [App Shortcuts](https://developer.apple.com/design/human-interface-guidelines/app-shortcuts) | OS integration | Native platform integration | default | Shared material / guideline only |
| [Complications](https://developer.apple.com/design/human-interface-guidelines/complications) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Controls](https://developer.apple.com/design/human-interface-guidelines/controls) | iOS component | GlassControlTile | default, pressed, selected, disabled | Shared material / guideline only |
| [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) | iOS component | GlassLiveActivity | default, expanded, minimized | Shared material / guideline only |
| [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications) | iOS component | GlassNotification | default, expanded | Shared material / guideline only |
| [Snippets](https://developer.apple.com/design/human-interface-guidelines/snippets) | iOS component | GlassSnippet | default | Shared material / guideline only |
| [Status bars](https://developer.apple.com/design/human-interface-guidelines/status-bars) | OS integration | Native platform integration | default | Shared material / guideline only |
| [Top Shelf](https://developer.apple.com/design/human-interface-guidelines/top-shelf) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Watch faces](https://developer.apple.com/design/human-interface-guidelines/watch-faces) | Other platform | Not an iOS component | default | Shared material / guideline only |
| [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets) | iOS component | GlassWidget | default, selected | Shared material / guideline only |

## Additional compositions

- **Clear dock** — `GlassDock / GlassDockItem`. Transparency follows the supplied iOS 27 dock reference. Generic demo symbols are separate from the material.
- **Chips and tokens** — `GlassChip / GlassToken`. A custom capsule composition using native regular and tinted glass. Apple does not define a separate iOS chip control.
- **Standard materials** — `MaterialSurface`. Ultra-thin, thin, regular and thick materials belong in the content layer.
- **Background extension** — `GlassBackgroundExtension`. Extend a known image beneath floating navigation without duplicating interactive content.

## API examples

```tsx
// Transparent media dock. Its icons remain ordinary accessible buttons.
<GlassDock dimming={0} tint={[1, 1, 1, 0.035]}>
  <GlassDockItem label="Home" onClick={openHome}><HomeIcon /></GlassDockItem>
</GlassDock>

// Real modal focus isolation, with an explicit return target for Safari mouse activation.
<GlassAlertDialog open={open} onOpenChange={setOpen}
  returnFocusRef={triggerRef} title="Delete item?" message="This removes the selected item."
  actions={[{label:'Cancel',intent:'cancel'},
    {label:'Delete',intent:'destructive',onSelect:deleteItem}]} />

<GlassSheet open={open} onOpenChange={setOpen} title="Details"
  returnFocusRef={triggerRef} detents={['medium','large']}><Details /></GlassSheet>
```

For refraction in a dialog/popover outside the original media plane, pass its image/video/canvas `source` ref and `sourceVersion` for static canvas invalidation. Without a readable source, the component uses CSS material. Native dialog/popover APIs own focus isolation, top-layer ordering and dismissal; callbacks own application actions.

[Validation record](VALIDATION.md) · [Materials and adaptivity](MATERIAL_PRESETS.md) · [Motion](MOTION.md)
