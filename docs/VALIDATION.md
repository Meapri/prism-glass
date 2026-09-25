# Validation record

Date: 2026-09-25. Release: `0.1.0-alpha.1`.

## Safari regression fixed

[Passing CI run](https://github.com/Meapri/prism-glass/actions/runs/36100530137) on core commit `fc36d69c2b607d149684b2df43fd8041579e88d1`.

The preceding version reproduced the reported failure in native Safari 26.6.2 and Playwright WebKit: **0 changed pixels** with frost and highlights disabled. The revised SVG resource loading, active graph branches, image-load refresh, and source-aligned primitive bounds pass the same optical test. These changes were validated together; the test does not attribute the failure to one individual WebKit quirk.

- Chromium, Firefox and WebKit: **12/12 browser tests passed** (four per engine).
- Native macOS Safari 26.6.2: actual pixel displacement without frost/highlights, switch state, keyboard slider input and the 20 lifecycle checks passed.
- The rebuilt demo uses contained switch tracks, capsule slider thumbs, separate crisp labels, pointer dragging, and reduced-motion-aware switch movement. It is an independent web interpretation, not a pixel-identical copy of iOS 27 or Apple’s private shader.

## Completed

- `npm test`: **16/16 passed**. Covers displacement symmetry and direction, neutral centers/index, rounded-corner masks, finite edge calculations, bounded map allocation, neutral-channel encoding, invalid geometry, radius normalization, server-side imports/rendering of the core and React adapter, circle/ellipse geometry, dome/concave direction, complementary frost masks, and preset behavior.
- Interactive checks in a managed Chromium browser: **20/20 passed**. Covers original DOM/event preservation, map reuse for position/strength, shape invalidation, atomic validation, exclusive source ownership, disable/enable, pixel-budget suspension, disposal, remounting, filter-ID refresh, preserving later external filter edits during cleanup, circular material maps, frost-strength cache reuse and frost-distribution invalidation.
- Visual inspection in that Chromium environment: text, grid lines and the background ribbon bend inside the lens; turning refraction off restores their original geometry. The separate tab controls select correctly.
- Shape/material follow-up: circular dome refraction was visually inspected; button and switch clicks and a keyboard slider change produced the expected states. Hard CSS outlines on the main demo lens were removed independently of frost.
- The observed demo's main source was approximately **0.40 megapixels**, with a **236 × 140** optical map. These are diagnostics for this viewport, not performance benchmarks.
- `npm pack` and installation of that tarball into a separate empty project passed. The installed core and optics ESM exports imported successfully without React or other runtime dependencies.
- No application error was observed in the browser log during these checks. The browser extension emitted unrelated metadata errors.

## Not established

| Target or claim | Status |
| --- | --- |
| Other native macOS Safari versions | Only 26.6.2 tested in this CI run |
| Native iOS Safari / WebViews | Not run |
| Firefox on physical target devices | Linux automation passed; device coverage remains |
| Exact iOS 27 visual/material match | Not established |
| React client mount/unmount and StrictMode | Adapter implemented; SSR tested; client integration gate remains |
| Sustained 60/120 FPS, GPU time, energy or mobile thermal behavior | Not measured |
| Whole-page, video, canvas or iframe refraction | Outside this release's contract |

The `visualSupportVerified` diagnostic remains `false` deliberately. Selecting the SVG path or observing a nonempty CSS filter is not an optical capability test.

## Reproduce and extend

```sh
npm ci
npm test
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

The browser suite compares source pixels with the effect on/off, runs the lifecycle checks, and checks keyboard tab selection. Frost and highlights are disabled for the pixel comparison, so it specifically checks displacement; it does not establish fidelity to Aave or Apple. Playwright WebKit is not native Safari.

Open the standalone demo in native Safari and Firefox. Compare on/off rendering over text and grid lines, move the lens without map rebuilds, change shape/frost, run the built-in checks, then inspect scrolling, zoom, DPR changes, reduced transparency, tab visibility and repeated mounting. Use browser profilers on intended devices with representative content; record frame percentiles and source dimensions rather than quoting this demo's map-preparation counter as GPU time.

The included GitHub Actions workflow runs the unit and three-engine suites on Linux and the native Safari suite with `safaridriver` on macOS. The macOS job records the actual browser version rather than treating Playwright WebKit as Safari.
