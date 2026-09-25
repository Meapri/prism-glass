# Validation record

Date: 2026-09-25. Release: `0.1.0-alpha.1`.

## Completed

- `npm test`: **9/9 passed**. Covers displacement symmetry and direction, neutral centers/index, rounded-corner masks, finite edge calculations, bounded map allocation, neutral-channel encoding, invalid geometry, radius normalization, and server-side imports/rendering of the core and React adapter.
- Interactive checks in a managed Chromium browser: **17/17 passed**. Covers original DOM/event preservation, map reuse for position/strength, shape invalidation, atomic validation, exclusive source ownership, disable/enable, pixel-budget suspension, disposal, remounting, filter-ID refresh, and preserving later external filter edits during cleanup.
- Visual inspection in that Chromium environment: text, grid lines and the background ribbon bend inside the lens; turning refraction off restores their original geometry. The separate tab controls select correctly.
- The observed demo's main source was approximately **0.40 megapixels**, with a **236 × 140** optical map. These are diagnostics for this viewport, not performance benchmarks.
- `npm pack` and installation of that tarball into a separate empty project passed. The installed core and optics ESM exports imported successfully without React or other runtime dependencies.
- No application error was observed in the browser log during these checks. The browser extension emitted unrelated metadata errors.

## Not established

| Target or claim | Status |
| --- | --- |
| Native macOS Safari | Not run |
| Native iOS Safari / WebViews | Not run |
| Firefox | Not run |
| Automated Playwright Firefox/WebKit | Test files included; not run in this session |
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

The browser suite compares source pixels with the effect on/off, runs the lifecycle checks, and checks keyboard tab selection. A passing pixel comparison establishes a visible effect; it does not establish fidelity to Aave or Apple. Playwright WebKit is not native Safari.

Open the standalone demo in native Safari and Firefox. Compare on/off rendering over text and grid lines, move the lens without map rebuilds, change shape/frost, run the built-in checks, then inspect scrolling, zoom, DPR changes, reduced transparency, tab visibility and repeated mounting. Use browser profilers on intended devices with representative content; record frame percentiles and source dimensions rather than quoting this demo's map-preparation counter as GPU time.

The included CI workflow provides the same unit and three-engine automated gates when the project is put in a repository. It has not been executed remotely for this alpha.
