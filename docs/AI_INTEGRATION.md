# Integrating Prism Glass with an AI coding agent

Use this guide when adding `@meapri/prism-glass` to an existing application. Preserve the application's routing, data, design tokens and business actions. The demo is a reference, not an application template.

## Read in this order

1. `llms.txt`: version, install status and entry points.
2. This guide: choose a rendering path and component.
3. `api.json` or [API_REFERENCE.md](API_REFERENCE.md): exact exported names and declarations generated from this version. Follow the declaration-file path into `dist/` for complete inherited types.
4. [Reusable recipes](../examples/recipes/README.md): complete components using only public imports, with no demo assets or source aliases.
5. [Integration verification](INTEGRATION_TESTS.md): commands and limits of actual consumer tests.

Do not invent a prop from another glass library. Type declarations and `api.json` describe this package; old screenshots and historical validation notes do not change its API.

## Install and import

This alpha is distributed as a local `.tgz`; it has not been published to the npm registry. Check the supplied archive and `package.json` version before writing an install command. The [source repository](https://github.com/Meapri/prism-glass) contains the package and examples. To build an archive from a checkout:

```sh
npm ci
npm pack
```

In the consumer project, install the resulting archive by its real path. Import CSS once from the application's entry point or global layout:

```tsx
import { GlassButton, GlassSwitch } from '@meapri/prism-glass/react';
import '@meapri/prism-glass/styles.css';
```

| Import | Use | React required? |
| --- | --- | --- |
| `@meapri/prism-glass` | DOM source controller, materials, presets, motion and adaptation utilities | No |
| `@meapri/prism-glass/media` | Shared image/video/canvas renderer and media map generation | No |
| `@meapri/prism-glass/optics` | Pure geometry and SVG optical maps | No |
| `@meapri/prism-glass/react` | React components and hooks | React 18+ |
| `@meapri/prism-glass/styles.css` | Component styles, separately imported | No |

The package is ESM. Use public entry points, not deep imports into `src/`, `dist/` or the repository's demo. Core/media imports do not require React. The optional React adapter expects the application's React peer; it does not bundle a second React runtime. No Tailwind, icon package, CSS reset, hosted service or API key is required in the consumer.

## Choose the source before styling the glass

| Requested result | Integration | What is actually rendered |
| --- | --- | --- |
| A normal reusable glass-looking control on an existing page | `GlassButton`, `GlassSurface` etc. with CSS imported | CSS blur/tint/edge material; no arbitrary DOM refraction |
| Refract a supplied decorative DOM layer | `refractionTarget={<DecorativeContent />}` on a supported surface/button | Inert decorative source through SVG; interactive children stay crisp |
| Refract the existing DOM element itself | `createGlass(element, options)` or `GlassSource` | The element's own painted pixels; not an implicit page backdrop |
| Several surfaces over one image/video/canvas | `GlassMediaScene source={ref}` or `createMediaGlass(canvas, source, options)` | One media texture and shared WebGL optical fields |
| Standard translucent reading/content surface | `MaterialSurface` | Standard CSS material without optical lensing |

`appearance="adaptive"` samples background color for legibility; it does not capture the page and is not a substitute for a refraction source. Unknown or cross-origin pixels remain unavailable. Do not use screenshots, automatic DOM cloning, `html2canvas`, a duplicated video, or fake status text to conceal a missing source.

### Media composition requirements

- Give the scene a nonzero explicit size or aspect ratio.
- Mount the source `<img>`, `<video>` or `<canvas>` when the scene mounts; a late replacement of the DOM source requires remounting the scene. An image/video loading its content later is supported.
- Put interactive children in `.prism-media-controls` and position them within the same scene. The decorative source is not a second interactive UI.
- Use same-origin media, or set the appropriate `crossOrigin` attribute before loading media whose server permits CORS. Authentication, DRM and cross-origin iframes are not bypassed.
- Keep source and scene untransformed. Native top-layer dialogs/popovers can receive the original `source` ref; their renderer aligns with the source element using `sourceAlignment: 'element'`.
- Increment `sourceVersion` after repainting a static canvas. Video frames update automatically. Set `media={{live:true}}` only for continuously changing canvas pixels.
- Read `data-prism-state` / `data-prism-reason` or `media.onStatus`. `ready` means the renderer is running, not proof of fidelity or a guaranteed frame rate.

## Component selection

All React exports come from `/react`. Required props below are a quick routing aid; consult the generated declarations for exact types and inherited attributes.

| Need | Component(s) | Main contract |
| --- | --- | --- |
| Theme defaults | `GlassProvider` | `variant`, `appearance`, `tintLevel`, `dimming`, `tint`, `children` |
| Action | `GlassButton` | Native button attributes; `onClick`, `disabled`, `loading`, `emphasis`, `intent`, `size`, `shape` |
| Switch | `GlassSwitch` | `checked` / `defaultChecked`, `onCheckedChange`; give an accessible name |
| Numeric range | `GlassSlider` | `value` / `defaultValue`, `onValueChange`, `min`, `max`, `step`; accessible name |
| Segments with panels | `GlassTabs` | Required nonempty, unique `items`; `value`, `onValueChange`; item `content` creates panels |
| App navigation tabs | `GlassTabBar` | Required `items` with `value`, `label`, `icon`; `value`, `onValueChange`, `accessory`, `minimized` |
| Navigation / tools | `GlassNavigationBar`, `GlassToolbar`, `GlassSidebar`, `GlassInputAccessory` | Navigation title / sidebar items; caller supplies actions and route changes |
| Surface / presence / nearby light | `GlassSurface`, `GlassPresence`, `GlassLightGroup` | Surface `preset`; presence requires `present`; light group scopes illumination, not geometry merging |
| Chip / removable token | `GlassChip`, `GlassToken` | `selected`, `onSelectedChange`; token `onRemove` and `removeLabel` |
| Clear dock | `GlassDock`, `GlassDockItem` | Item requires `label`; caller supplies icon children and `onClick` |
| Text / search | `GlassTextField`, `GlassSearchField` | `value`, `onValueChange`, accessible label; search adds `onSearch` / `onCancel` |
| Stepper / pages | `GlassStepper`, `GlassPageControl` | Stepper range and value; page control requires `count`, uses zero-based `value` |
| Selection / wheel | `GlassSelect`, `GlassWheelPicker` | Required nonempty, unique `options`; wheel also requires `label`; values are strings |
| Date / color | `GlassDatePicker`, `GlassColorWell` | Date value is `YYYY-MM-DD`; controlled `value` / `onValueChange` |
| Popup | `GlassPopover` | Required `trigger` and `children`; optional `open`, `onOpenChange`, `source`, alignment |
| Actions / submenus | `GlassMenu`, `GlassPullDownButton`, `GlassContextMenu`, `GlassEditMenu` | Required `items`; trigger for menu variants; item `onSelect`, `disabled`, `checked`, `items` |
| Action sheet | `GlassActionSheet` | Required `trigger`, `actions`; uses a top-layer menu |
| Modal | `GlassDialog`, `GlassAlertDialog`, `GlassSheet`, `GlassShareSheet` | Required `open`, `onOpenChange`; alert also `title`, `actions`; share also `title` |
| Static alert surface | `GlassAlert` | Required `title`; it is not a focus-isolating modal by itself |
| Notification / system-style composition | `GlassNotification`, `GlassWidget`, `GlassLiveActivity`, `GlassControlTile`, `GlassSnippet` | In-page UI only. Notification requires `title`, `message`; tile requires `label` |
| Reading / layout / indicators | `MaterialSurface`, `GlassDisclosure`, `GlassScrollArea`, `GlassBackgroundExtension`, `GlassListRow`, `GlassSeparator`, `GlassProgress`, `GlassBadge` | Disclosure requires `title`; background extension requires `src`; progress accepts normalized `value` / `max` |

The `64` HIG entries are a coverage inventory, not 64 exported components or implementations of OS services. This package does not deliver push notifications, install widgets, register home-screen shortcuts, start Live Activities or supply an operating-system keyboard.

## State, actions and accessibility

- Choose controlled state (`value`/`checked`/`selected` plus its callback) or an uncontrolled default. Do not supply an immutable controlled value and expect the control to update itself.
- Numeric sliders/steppers use `onValueChange(number)`, switches use `onCheckedChange(boolean)`, and menus use item `onSelect()` or menu `onSelect(id)`; these are not interchangeable DOM events.
- Dialogs/sheets are controlled. Supply `open` and `onOpenChange`. Use `returnFocusRef` pointing to the trigger, especially for Safari pointer activation; use `initialFocusRef` when a task needs a particular starting field.
- A static `GlassAlert` does not provide modal isolation. Choose `GlassAlertDialog` for a decision that blocks background interaction.
- Keep application side effects in caller callbacks. A share-sheet layout does not send a message, upload a file, or grant permission by itself.
- Supply labels for icon-only buttons, switches, sliders and inputs. Preserve keyboard, focus-visible, disabled and reduced-motion/contrast behavior. Avoid lowering the opacity of the entire control to make only its material transparent.
- `className`, `style` and native attributes are supported where declared. Prefer component props and documented CSS variables; do not rewrite internal DOM or add global CSS resets.

## Material and performance choices

- `regular`: default readable controls and short text. `clear`: bold controls over supplied rich media. `MaterialSurface`: content/reading plane.
- Clear's general default has 35% local dimming. For the transparent dock recipe use `dimming={0}` and `tint={[1,1,1,0.035]}`. Foreground remains opaque; choose appropriate contrast for your own source.
- `tintLevel` is a 0–1 Regular opacity/diffusion preference, not a general glass opacity control. `tint` is normalized RGBA; `dimming` changes the backdrop.
- Use an existing preset before overriding optical coefficients. Explicit component props override presets. Some presets select their own variant; pass `variant="clear"` explicitly when that is the intended override.
- Media fields use 16-bit coordinates, up to 1024px by default (2048 configurable), display DPR capped at 3 and a shared 4M field-pixel budget. SVG fields retain their separate 8-bit/512px limit. Do not use media limits as SVG limits.
- Reuse one media scene for related lenses. Always destroy imperative controllers when their elements unmount. Do not wrap a whole scrolling application in a source filter or create an animation loop for static content.
- A normal nested toolbar uses one glass background. Do not force every nested button into a second optical layer. `GlassDock` provides its own layered tile composition.

## Next.js App Router

Import the stylesheet once in `app/layout.tsx`. The published `/react` entry includes a preserved `"use client"` directive. A Server Component may render a Prism component with serializable props. Put state, event handlers and DOM refs in your own Client Component; the library boundary cannot serialize a callback created in a Server Component.

```tsx
// app/layout.tsx
import '@meapri/prism-glass/styles.css';
import type { ReactNode } from 'react';
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```tsx
// app/page.tsx — Server Component, no handler crosses the boundary
import { GlassButton } from '@meapri/prism-glass/react';
import { ControlsExample } from './ControlsExample';
export default function Page() {
  return <main><GlassButton>Static server-composed action</GlassButton><ControlsExample /></main>;
}
```

Copy [ControlsExample.tsx](../examples/recipes/ControlsExample.tsx), including its client directive, for the stateful portion. Do not add `ssr:false`, disable type checking, or add `transpilePackages` simply to hide an integration error. [Next.js library-author guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components#third-party-components) describes the boundary.

## Common wrong turns

| Symptom / wrong approach | Correct action |
| --- | --- |
| Glass looks like plain frosted CSS | Decide whether CSS material is sufficient. For real lensing, supply a DOM/media source and check renderer diagnostics. |
| Invisible/collapsed media | Give the scene dimensions; mount the source; wait for its image/video pixels; inspect the reported reason. |
| Copying the entire demo to add one button | Import the component and CSS, then provide the application's handler and state. |
| Passing `blur`, `strength` or `resolution` directly to a button | Use declared `optics` where appropriate; media output quality belongs on `GlassMediaScene media` or `createMediaGlass` options. |
| Inferring `GlassModal`, `GlassCard`, `blurAmount`, `intensity` etc. | These names are not the API. Check `api.json` and use `GlassDialog` / `GlassSurface` and declared props. |
| Setting `opacity` on the control | Set `tint` / `dimming` so foreground remains readable. |
| A changing canvas is stale | Increment `sourceVersion` or explicitly opt into `media.live`. |
| Cleanup / StrictMode causes duplicate owners | Instantiate after mount and destroy on cleanup; do not reuse a destroyed controller. |
| Calling a browser controller during SSR | Pure imports/geometry are safe; create DOM/WebGL controllers only after the elements mount. |
| Treating `visualSupportVerified: false` as renderer failure | This flag deliberately does not claim universal pixel verification. Check `state` and `reason`. |

## Completion criteria for an integration

Typecheck and production-build the **consumer** with its real React/framework version and the actual tarball. Render the relevant route, check hydration/console errors, exercise an action and a controlled input, verify modal focus if used, and verify the intended source renderer or fallback. Record what passed; don't substitute the demo's test count for these checks.

## Task prompt for another coding agent

> Read this package's `llms.txt`, integration guide and generated API before editing the app. Identify the existing framework, the required controls and the actual refraction source. Compose public Prism components around the application's own state/actions; preserve its layout and accessibility. Use the exact declared props and import CSS once. Explain when the result uses CSS material versus real SVG/media refraction. Typecheck, production-build and exercise the installed package in this app, including keyboard/focus and source readiness where relevant. Report verified results and remaining limits.
