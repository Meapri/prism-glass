# Prism Glass

An independent, source-first Liquid Glass library inspired by the rendering architecture described in Aave's **Building Glass for the Web**. Version `0.1.0-alpha.1`; the package name is provisional and has not been published to npm.

The TypeScript core has **zero runtime dependencies**. The optional React adapter requires React 18+. This release is a small, real implementation, not a claim of production readiness or verified native Safari support.

[한국어 빠른 시작](README.ko.md)

## What this version does

- Refracts the **actual DOM inside a source element** through a rounded rectangle, circle, capsule or ellipse, using ordinary CSS `filter` and SVG `feDisplacementMap`.
- Keeps the same DOM nodes and event listeners. There is no page screenshot or automatic DOM cloning.
- Preserves the original source outside the lens through a mask/composite stage.
- Provides rim/dome/concave surfaces, depth and curvature controls, uniform/center/edge frost, and configurable edge highlights.
- Includes size-aware starting presets for buttons, switches, sliders, tabs and panels. The demo includes live button, switch and slider examples with crisp interaction layers.
- Reuses decoded optical maps when position, strength, or frost changes. Maps are at most 512 × 512; default longest side is 256.
- Coalesces updates through one animation-frame callback, pauses offscreen/hidden sources, honors reduced-transparency preferences, and imposes a source pixel budget.
- Includes idempotent teardown, stale asynchronous map cancellation, a React hook/component, a standalone interactive demo, and tests.

**This is a source filter.** Placing an empty glass element over an unrelated page will not bend the page behind it. Pass the actual content that should be refracted. Place crisp labels or buttons in a sibling overlay if desired.

## Build a local package

From a checkout of this repository:

```sh
npm ci
npm run build
npm pack
```

This creates `meapri-prism-glass-0.1.0-alpha.1.tgz`. Install that file in your application, or use the supplied tarball if you downloaded the release archive:

```sh
npm install ./meapri-prism-glass-0.1.0-alpha.1.tgz
```

The package is not published to the npm registry. Install the local tarball until a registry release is announced.

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

## React

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
| `blur` | `0` | Gaussian standard deviation, 0–16 px; center detail is affected |
| `blurMode` | `'uniform'` | `'center'` preserves clearer edges; `'edge'` preserves a clear center; transition width uses `bevel` |
| `highlight` | `0.55` | Rim-light opacity multiplier, 0–1 |
| `resolution` | `256` | Longest map side, clamped to 32–512 |
| `maxSourcePixels` | `4_000_000` | Source width × height × DPR² safety budget; not a hardware speed estimate |
| `enabled` | `true` | Disables filtering without releasing reusable maps |
| `live` | `false` | Repaint filter output every frame for self-animating content; opt in only when necessary |
| `refreshFilterId` | `'auto'` | WebKit ID-cache workaround; `'always'` and `'never'` allow controlled testing |
| `respectReducedTransparency` | `true` | Disables the filter when the media preference is active |
| `onStatus` | none | Called on state/reason transitions with a diagnostics snapshot |

`update` validates synchronously and batches rendering. `refresh` schedules a render after an external content/style change. `destroy` cancels queued work and releases owned SVG definitions and blob URLs. A controller is not reusable after destruction; create a new one.

Diagnostics expose the selected rendering path and counters, **not** a verified browser capability result. `mapGenerationMs` includes CPU map generation, PNG encoding and image decoding; it is neither a GPU duration nor a frame-time measurement.

## Rendering contract and known limits

1. Use a small, mounted, untransformed source wrapper without an existing CSS filter. In-place filtering rasterizes the full source even when the lens is small. Do not wrap an entire scrolling app.
2. One lens/controller per source in this release. Multiple independent sources are supported; overlapping lenses on a shared source are not implemented.
3. Rounded rectangles, circles, capsules and ellipses are supported; arbitrary SVG paths and polygons are not. Lens positions are not automatically aligned with unrelated fixed/sticky elements or transformed ancestors.
4. A single-interface approximation generates the offset field. This is not Apple's or Aave's proprietary shader, nor full physical ray tracing. Chromatic dispersion and spring/morph animations are not included yet.
5. `<video>`, canvas pixels, cross-origin iframes, and arbitrary compositor layers are not promised by this SVG renderer. A direct-media WebGL renderer is a future separate module.
6. CSS filters do **not** transform hit-test coordinates. Strong distortion can move painted text away from its logical click/selection position. Keep interactive labels in the crisp overlay, or use a mild lens.
7. Safari behavior varies by OS, hardware, and version. The implementation includes conservative dimensions, blob map URLs, sRGB interpretation and optional ID refresh, but needs native Safari/iOS visual testing before production use. Do not equate automated WebKit with native Safari.
8. Filters introduce stacking/containing-block effects. Plan `position: fixed`, overflow and z-index around an explicit source wrapper.
9. Strict CSP must permit these generated optical map images (`img-src blob:`), and the application's usual style policy must permit the styles used by its integration. No images or page content are sent to a server.
10. The library honors reduced transparency; the caller owns motion, focus, contrast, and readable fallback UI. `live` is an invalidation policy, not a decorative motion API. The demo respects reduced motion separately.
11. Spatial frost blends sharp and Gaussian-blurred refracted pixels with a shape-aware mask. It is a visual approximation rather than a continuously varying blur kernel. It needs an extra map and additional composition passes; choose uniform frost when that distinction is not needed.

## Development

```sh
npm ci
npm test
npm run dev
```

`demo/index.html` is self-contained after `npm run build`; it needs no CDN. Re-run the build after editing source files to refresh the bundled demo. The development server serves that generated file.

The page includes a small browser lifecycle check runner. Automated cross-engine checks can be run using the included Playwright setup:

```sh
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

See [VALIDATION.md](docs/VALIDATION.md) for actual results and unverified areas, and [ARCHITECTURE.md](docs/ARCHITECTURE.md) for implementation boundaries.

## References and provenance

- [Aave: Building Glass for the Web](https://aave.com/design/building-glass-for-the-web)
- [W3C Filter Effects](https://www.w3.org/TR/filter-effects-1/)
- [WebKit backdrop SVG filter issue](https://bugs.webkit.org/show_bug.cgi?id=245510)
- [WebKit foreignObject issue](https://bugs.webkit.org/show_bug.cgi?id=313914)

The source was written independently for this project. No Aave branding, graphics, or implementation files are bundled. See [NOTICE.md](NOTICE.md).
