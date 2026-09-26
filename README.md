# Prism Glass

An independent, source-first Liquid Glass library with materials calibrated against native **iOS 27** and the rendering architecture described in Aave's **Building Glass for the Web**. Version `0.5.0-alpha.2`; the package name is provisional and has not been published to npm.

The TypeScript core has **zero runtime dependencies**. The optional React components require React 18+. This is an alpha; see the [validation record](docs/VALIDATION.md) for the browsers and flows actually checked.

**For AI coding agents:** start with [llms.txt](llms.txt), then the [integration guide](docs/AI_INTEGRATION.md), [generated API reference](docs/API_REFERENCE.md) and [copyable consumer recipes](examples/recipes/README.md). [api.json](api.json) is checked against real exports. [llms-full.txt](llms-full.txt) contains the guide, signatures and complete recipes in one file. These files also ship in the package and are [available on the site](https://meapri.github.io/prism-glass/llms.txt).

[Live demo](https://meapri.github.io/prism-glass/) · [iOS 27 component catalog](https://meapri.github.io/prism-glass/catalog.html) · [한국어 빠른 시작](README.ko.md)

See the [native iOS 27 comparison and measured defaults](docs/IOS27_REFERENCE.md). Aave informs the renderer; native SwiftUI and Apple guidance are the visual target.

## What this version does

- Refracts the **actual DOM inside a source element** through a rounded rectangle, fitted continuous corner, circle, capsule or ellipse, using ordinary CSS `filter` and SVG `feDisplacementMap`.
- Keeps the same DOM nodes and event listeners. There is no page screenshot or automatic DOM cloning.
- Preserves the original source outside the lens through a mask/composite stage.
- Provides rim/dome/concave surfaces, depth and curvature controls, uniform/center/edge frost, and configurable edge highlights.
- Includes size-aware starting presets for buttons, switches, sliders, tabs and panels. The demo includes live button, switch and slider examples with crisp interaction layers.
- Reuses optical maps when position, strength, or frost changes. SVG maps use a 256px default cap; media uses 16-bit displacement fields sized for the display, up to 1024px by default.
- Coalesces updates through one animation-frame callback, pauses offscreen/hidden sources, honors reduced-transparency preferences, and imposes a source pixel budget.
- Includes menus, alerts, detented sheets, navigation, search, pickers, notifications, widgets, a transparent dock and shared media scenes. The complete [64-entry HIG coverage record](docs/HIG_COVERAGE.md) separates interactive controls, standard content and OS-owned integrations.
- Shares optical maps and one video texture across media lenses, with chromatic edging, local dimming, frost and touch lighting.
- Provides regular/clear materials, spring selection, keyboard navigation, RTL geometry, and accessibility preferences.
- Includes idempotent teardown, context-loss recovery, React StrictMode checks, component, material, motion and optical demos, and pixel regressions.

**This is a source filter.** Placing an empty glass element over an unrelated page will not bend the page behind it. Pass the actual content that should be refracted. Place crisp labels or buttons in a sibling overlay if desired.

## Build a local package

From a checkout of this repository:

```sh
npm ci
npm pack
```

This creates `meapri-prism-glass-0.5.0-alpha.2.tgz`. Install that file in your application, or use the supplied tarball if you downloaded the release archive:

```sh
npm install ./meapri-prism-glass-0.5.0-alpha.2.tgz
```

The package is not published to the npm registry. Install the local tarball until a registry release is announced.

`npm pack` runs `build:lib`: library JavaScript, declarations, CSS and generated AI guidance only. It does not build the demo or ship native reference images. Use `npm run build` for library plus demo, and `npm run test:consumers` to install the actual tarball into isolated React/Vite and Next.js applications.

For Next.js App Router, import the CSS in the root layout. The `/react` entry retains its client directive; put your event handlers, state and DOM refs in a Client Component. See the [complete Next.js integration instructions](docs/AI_INTEGRATION.md#nextjs-app-router).

## Light and motion

Glass responds to contact with a localized SDR bloom, a brighter rim and weak neighboring illumination. `GlassPresence` coordinates material formation and content resolve through an interruptible exit/entry, then unmounts the surface. Native popovers animate automatically.

```tsx
<GlassPresence present={open} preset="popover">…</GlassPresence>
```

See [motion usage and official references](docs/MOTION.md), or try [the motion demo](https://meapri.github.io/prism-glass/#motion). Actual HDR output and matched-geometry merging are not implemented.

## Purpose-specific glass surfaces

Twenty-four [surface presets and adaptive appearance](docs/MATERIAL_PRESETS.md) cover navigation, toolbars, tab bars, search, buttons, floating actions, selection, menus, popovers, sidebars, sheets and media overlays. Presets resolve geometry, curvature, depth, refraction, diffusion and elevation together.

```tsx
<GlassSurface preset="navigation" appearance="adaptive">…</GlassSurface>
<GlassSurface preset="sidebar" appearance="adaptive">…</GlassSurface>
```

`adaptive` reads the content behind a surface; `auto` follows the OS. Compact Regular glass can switch light/dark, larger reading surfaces retain their appearance while tint/shadow adapt, and Clear remains static. CSS colors/simple gradients and readable media pixels are supported. Unknown compositor effects fall back explicitly or accept a caller-provided sample. See the linked API contract and provenance.

## React component library

```tsx
import { GlassProvider, GlassButton, GlassSwitch, GlassSlider,
  GlassTabs, GlassToolbar, GlassPopover } from '@meapri/prism-glass/react';
import '@meapri/prism-glass/styles.css';

<GlassProvider variant="regular" appearance="auto" tintLevel={0.5}>
  <GlassButton refractionTarget={<DecorativeArtwork />}>Add item</GlassButton>
  <GlassSwitch aria-label="Notifications" checked={enabled}
    onCheckedChange={setEnabled} />
  <GlassSlider aria-label="Volume" value={volume} onValueChange={setVolume} />
</GlassProvider>
```

| Component | Behavior |
| --- | --- |
| `GlassButton` | Native button, capsule/rectangle/circle, press and focus feedback |
| `GlassSwitch` | Controlled/uncontrolled switch, spring thumb, optional form name/value |
| `GlassSlider` | Native range input, controlled/uncontrolled value, keyboard/RTL support |
| `GlassTabs` | Roving focus, disabled items, arrow/Home/End navigation, optional linked panels |
| `GlassToolbar` | One material surface; child buttons use thin overlays instead of another glass layer |
| `GlassPopover` | Native Popover API, light dismissal, Escape, viewport placement and focus return |
| `GlassSurface` | A floating material surface with crisp children |
| `GlassMediaScene` | Registers child surfaces with one media renderer |

**Rendering is explicit.** `refractionTarget` is decorative, caller-owned content rendered in an inert optical layer. Without a target or media scene, a surface uses CSS blur/tint (`data-prism-renderer="css-material"`), not a claim of refracting arbitrary DOM behind it. The low-level `GlassSource` still filters the original DOM directly. Use `GlassSurface local` for a surface that should opt out of an enclosing media scene; popovers do this automatically.

Use `regular` for general controls and text. Use `clear` over rich media with bold, bright foreground controls. Clear media lenses default to local 35% dimming; React material props and the media API both accept `dimming`. The transparent dock uses `dimming={0}` and `tint={[1,1,1,.035]}`; check foreground contrast against your source. Keep variants consistent within a group. [Design decisions and limits](docs/LIQUID_GLASS.md).

### A shared media scene

```tsx
const video = useRef<HTMLVideoElement>(null);

<GlassMediaScene source={video} variant="clear"
  media={{ fit: 'cover' }} style={{ aspectRatio: '16 / 9' }}>
  <video ref={video} src="/clip.mp4" playsInline muted />
  <div className="prism-media-controls">
    <GlassButton shape="circle" aria-label="Play"
      style={{ position: 'absolute', left: 120, top: 80 }}
      onClick={() => video.current?.play()}>▶</GlassButton>
  </div>
</GlassMediaScene>
```

Import `GlassMediaScene` from `/react`. The video stays a real media element; no duplicate video or automatic page capture is created. The scene aligns `fit`, `position`, and `backgroundColor` with its direct video/image child. Keep the source and scene untransformed. The source must exist when the scene mounts; remount the scene when replacing the source element itself. DOM tracks (switches/sliders/tabs) continue using their own SVG source, even inside a media scene.

### Framework-independent media renderer

```ts
import { createMediaGlass } from '@meapri/prism-glass/media';

const renderer = createMediaGlass(overlayCanvas, video, {
  fit: 'cover', pixelRatio: 2, maxPixels: 4_000_000,
  lenses: [{
    id: 'play', variant: 'clear',
    lens: { x: 100, y: 80, width: 120, height: 120, radius: 60, shape: 'circle' },
    surface: 'dome', strength: 28,
  }],
  onStatus: diagnostics => { /* expose fallback/error states in your UI */ },
});
renderer.updateLens('play', { lens: { x: 160 }, press: 0.5 });
renderer.setLenses(nextLenses);
renderer.refresh(); // After manually repainting a canvas source.
renderer.destroy();
```

`canvas` must be a dedicated mounted overlay. Match the visible source's `object-fit`, normalized `position`, and RGB `backgroundColor` (channels 0–1, black by default), or use `sourceAlignment: 'element'` to follow the source element's position and object fit. Media `resolution` caps each optical field at 32–2048 pixels (default 1024); actual fields adapt to display density and share a four-million-pixel budget. Directions use packed 16-bit values with linear interpolation. `pixelRatio` defaults to the display DPR, capped at 3, and `maxPixels` bounds the output canvas independently of media decode costs. Video uploads follow `requestVideoFrameCallback` where available; paused media and idle canvases stop scheduling frames. Use `live: true` only for continuously changing canvas sources. Position, strength, lighting and uniform geometry scaling reuse maps. A bounded cache retains up to four unused fields for press/release transitions. Diagnostics expose `mapPixels` and `mapPrecision`.

`getDiagnostics()` distinguishes loading, ready, paused, disabled, fallback, error and destroyed. WebGL unavailability/context loss must retain usable HTML controls; restore rebuilds GPU resources. Cross-origin security or media upload failures remain explicit errors. The optional `bindGlassInteraction(element, callback)` helper emits normalized press/hover/pointer state for framework-independent controls and returns a `destroy()` cleanup.

## Plain TypeScript

```html
<div class="scene">
  <div id="source">Content to refract</div>
  <div class="controls">Crisp controls above the optical source</div>
</div>
```

```ts
import { createGlass } from '@meapri/prism-glass';

const glass = createGlass(document.querySelector<HTMLElement>('#source')!, {
  lens: { x: 60, y: 40, width: 220, height: 120, radius: 30 },
  strength: 24,
  bevel: 28,
});

glass.update({ lens: { x: 140 } }); // CSS pixels relative to source's border box
glass.update({ strength: 12, blur: 0.5 });
console.log(glass.getDiagnostics());
glass.destroy(); // Call when the source is removed.
```

For artwork with rotated or overflowing descendants, use a clipped inner stacking context. Keep both layers out of forced GPU promotion (`translateZ(0)` / `will-change: transform`), which can cause native Safari to bypass an SVG source filter:

```html
<div id="source" class="optical-source">
  <div class="artwork">Content to refract</div>
</div>
```

```css
.optical-source { position: relative; width: 600px; height: 350px; overflow: hidden; }
.artwork { position: absolute; inset: 0; overflow: hidden; isolation: isolate; }
```

For plain script use, load `dist/prism-glass.global.js`; the same API is available as `PrismGlass.createGlass`.

## Shapes and materials

```ts
import { createGlass, lensFor, getGlassPreset } from '@meapri/prism-glass';

const lens = lensFor('circle', { x: 20, y: 20, width: 96, height: 96 });
const glass = createGlass(source, {
  ...getGlassPreset('button', lens),
  blurMode: 'edge', // soft rim, clear center
});
glass.update({ surface: 'concave', depth: 1.4, curvature: 2.5 });
```

`lensFor(shape, bounds)` fits the geometry and returns a complete lens. Circles fit the shorter side and are centered inside the supplied bounds; capsules force half-height/half-width caps; ellipses use an elliptical silhouette. A direct circle `lens` must have equal width and height. `radius` remains required when constructing a lens manually; the helper supplies it automatically.

| Preset | Surface and intended use |
| --- | --- |
| `button` | Full dome, clearer center and slightly frosted edge |
| `switch` | Stronger dome refraction over the track fill |
| `slider` | Gentler bend, preserving track readability |
| `tab` | Curved rim with light center frost |
| `panel` | Flat center, curved rim and stronger center frost |

Presets set optical options, not a DOM component or an automatic backdrop capture. Their strength and bevel scale to the supplied lens. After materially resizing a lens, call `getGlassPreset` again if you want those defaults recalculated. These are independent design choices, not Aave's or Apple's internal values.

## Low-level React adapter

```tsx
import { GlassSource } from '@meapri/prism-glass/react';

export function OpticalCard() {
  return (
    <GlassSource
      style={{ width: 360, height: 200, overflow: 'hidden' }}
      glass={{
        lens: { x: 70, y: 35, width: 220, height: 120, radius: 30 },
        strength: 22,
      }}
    >
      <YourLiveContent />
    </GlassSource>
  );
}
```

For an existing element, `useGlass(sourceRef, options)` returns a ref to the controller. The source must exist at mount. The adapter creates and destroys the controller in an effect; importing/rendering it on the server does not access `window` or `document`.

## Options

| Option | Default | Contract |
| --- | --- | --- |
| `lens` | required | `{ x, y, width, height, radius }`, in local CSS pixels |
| `strength` | `24` | Maximum sampling offset, clamped to 0–64 px |
| `ior` | `1.5` | Single-interface refractive index, 1–3 |
| `bevel` | `24` | Curved rim width, at most half the smaller lens dimension |
| `surface` | `'rim'` | `'rim'`: flat center; `'dome'`: full curved surface; `'concave'`: reversed dome refraction |
| `depth` | `1` | Relative surface height, 0–4; zero disables geometric bend |
| `curvature` | `4` | Surface exponent, 2–8; lower values give a broader dome |
| `blur` | `0` | Gaussian standard deviation, 0–24 px; center detail is affected |
| `saturation` | `1` | Source color saturation inside the lens, 0–3 |
| `blurMode` | `'uniform'` | `'center'` preserves clearer edges; `'edge'` preserves a clear center; transition width uses `bevel` |
| `highlight` | `0.55` | Rim-light opacity multiplier, 0–1 |
| `resolution` | `256` | Longest map side, clamped to 32–512 |
| `maxSourcePixels` | `4_000_000` | Source width × height × DPR² safety budget; not a hardware speed estimate |
| `enabled` | `true` | Disables filtering without releasing reusable maps |
| `live` | `false` | Repaint filter output every frame for self-animating content; opt in only when necessary |
| `refreshFilterId` | `'auto'` | WebKit ID-cache workaround; `'always'` and `'never'` allow controlled testing |
| `respectReducedTransparency` | `true` | Disables the filter when the media preference is active |
| `onStatus` | none | Called on state/reason transitions with a diagnostics snapshot |

`update` validates synchronously and batches rendering. `refresh` schedules a render after an external content/style change. `destroy` cancels queued work and releases owned SVG definitions and optical map references. A controller is not reusable after destruction; create a new one.

Diagnostics expose the selected rendering path and counters, **not** a verified browser capability result. `mapGenerationMs` includes CPU map generation, PNG encoding and image decoding; it is neither a GPU duration nor a frame-time measurement.

## Rendering contract and known limits

1. Use a small, mounted, untransformed source wrapper without an existing CSS filter. In-place filtering rasterizes the full source even when the lens is small. Do not wrap an entire scrolling app.
2. The SVG core owns one lens per DOM source. The separate media renderer supports up to 64 lenses on one video/image/canvas source; keep surfaces in one plane and avoid overlapping/nested glass.
3. Rounded rectangles, fitted continuous corners, circles, capsules and ellipses are supported; arbitrary SVG paths and polygons are not. Lens positions are not automatically aligned with unrelated fixed/sticky elements or transformed ancestors.
4. A single-interface approximation generates the offset field. This is not Apple's or Aave's proprietary shader, nor full physical ray tracing. Media lenses support a small chromatic fringe, and React selections use springs. Arbitrary shape merging and OS-level morphing are outside this release.
5. `<video>`, canvas pixels, cross-origin iframes, and arbitrary compositor layers are not promised by this SVG renderer. Use the separate `/media` renderer for direct video, image, or canvas pixels. It requires same-origin media or an appropriate CORS response.
6. CSS filters do **not** transform hit-test coordinates. Strong distortion can move painted text away from its logical click/selection position. Keep interactive labels in the crisp overlay, or use a mild lens.
7. Safari behavior varies by OS, hardware, and version. The implementation uses source-relative bounding-box coordinates, embedded PNG maps, sRGB interpretation and optional ID refresh. Native macOS Safari and automated WebKit have separate checks in the validation record; physical iOS verification is still required.
8. Filters introduce stacking/containing-block effects. Plan `position: fixed`, overflow and z-index around an explicit source wrapper.
9. Strict CSP must permit these generated optical map images (`img-src data:`), and the application's usual style policy must permit the styles used by its integration. No images or page content are sent to a server.
10. The components and stylesheet handle reduced motion, reduced transparency, increased contrast, forced colors, focus and fallback fills. Low-level renderer users must supply readable HTML controls and fallback styling. `live` is a repaint policy for animated canvas/DOM, not a decorative motion API.
11. Spatial frost blends sharp and Gaussian-blurred refracted pixels with a shape-aware mask. It is a visual approximation rather than a continuously varying blur kernel. It needs an extra map and additional composition passes; choose uniform frost when that distinction is not needed.

## GitHub Pages demo

The component library is published at [meapri.github.io/prism-glass](https://meapri.github.io/prism-glass/), with the [optical playground](https://meapri.github.io/prism-glass/optics.html) alongside it.

`npm run build:pages` assembles the component/optics/catalog pages, media/reference assets and public AI documentation in `pages-dist/`. Relative URLs support the repository subpath. Publish this directory to the root of the `gh-pages` branch, which is the configured Pages source. Updating `main` alone does not republish this branch-based demo. The site's reference images are deliberately excluded from the npm archive.

## Development

```sh
npm ci
npm test
npm run dev
```

`npm run dev` serves the component library at `/` and the original optical playground at `/optics.html`. JavaScript and CSS are bundled locally; the media demo uses `demo/assets/flower.mp4`. Use HTTP rather than opening the media example as `file://`. Rebuild after editing source files; no CDN is required at runtime.

The page includes a small browser lifecycle check runner. Automated cross-engine checks can be run using the included Playwright setup:

```sh
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

See [VALIDATION.md](docs/VALIDATION.md) for actual results and unverified areas, and [ARCHITECTURE.md](docs/ARCHITECTURE.md) for implementation boundaries.

## References and provenance

- [Aave: Building Glass for the Web](https://aave.com/design/building-glass-for-the-web)
- [Apple: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple: Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [W3C Filter Effects](https://www.w3.org/TR/filter-effects-1/)
- [WebKit backdrop SVG filter issue](https://bugs.webkit.org/show_bug.cgi?id=245510)
- [WebKit foreignObject issue](https://bugs.webkit.org/show_bug.cgi?id=313914)

The source was written independently for this project. No Aave branding, graphics, or implementation files are bundled. See [NOTICE.md](NOTICE.md).
