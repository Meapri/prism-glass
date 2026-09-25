# Validation record

Date: 2026-09-25. Release: `0.2.0-alpha.1`.

## Component library and media renderer

- `npm test`: **21/21 passed**. New coverage includes material defaults, spring settling after delayed frames, shared preference subscriptions, quadrant maps against a full-grid reference, and SSR of every public React component.
- `npx playwright test --project=chromium --project=webkit`: **36/36 passed** on macOS. Includes the original optical regressions, actual video play/pause/seek and material changes, mobile layout, keyboard controls, nonmodal popover dismissal/focus return, RTL selection, and React StrictMode cleanup/remount.
- Media pixel tests verify source orientation, a real displacement effect, unchanged pixels outside lenses, map/texture reuse, atomic validation, output pixel limits, letterbox matching, and WebGL context-loss/restoration. A simulated unavailable context verifies usable fallback playback controls.
- After the analytic rim/silhouette refinement and empty-scene cache cleanup, the media/component subset was rerun: **20/20 passed**.
- Installation of the generated `0.2.0-alpha.1` tarball into an empty project passed. Core, media, optics and CSS exports resolve without React. After installing React/ReactDOM **18.3.1** in that project, button, switch and popover flows passed in Chromium/WebKit with no application errors. The main suite uses React **19.3.0**.
- Final visual inspection compared the supplied 1260 × 697 reference with the rendered player and 1260px/390px demo screenshots: rounded media framing, large/side lens proportions, crisp foreground icons, the capsule scrubber, material contrast and mobile touch targets were inspected. Coarse scrubber rim artifacts were replaced by analytic WebGL edges. The MDN CC0 footage is an intentional content substitution.
- Accessibility checks exercise reduced motion plus increased contrast in Chromium/WebKit. Shared preference logic is unit tested. Physical OS-level reduce-transparency and forced-color display combinations still need device checks.
- Browser/IAB interaction check: add item, switch state, playback pause, popover placement/focus, and no application console errors. Automated layouts include desktop and 390 × 844 mobile; the optical regression also uses 420 × 900 at DPR 3.
- Native Safari verification of the new collection/media path is pending because the Mac is locked. The earlier native Safari result below applies to the SVG optical playground only.
- Firefox still fails at browser startup with `Could not find profile folder.`, including an explicitly created persistent profile; no application-level Firefox pass is claimed.

## Earlier remote Safari regression (0.1 alpha)

[Passing CI run](https://github.com/Meapri/prism-glass/actions/runs/36100530137) on core commit `fc36d69c2b607d149684b2df43fd8041579e88d1`.

The preceding version reproduced the reported failure in native Safari 26.6.2 and Playwright WebKit: **0 changed pixels** with frost and highlights disabled. The revised SVG resource loading, active graph branches, image-load refresh, and source-aligned primitive bounds pass the same optical test. These changes were validated together; the test does not attribute the failure to one individual WebKit quirk.

- Chromium, Firefox and WebKit: **12/12 browser tests passed** (four per engine).
- Native macOS Safari 26.6.2: actual pixel displacement without frost/highlights, switch state, keyboard slider input and the 20 lifecycle checks passed.
- The rebuilt demo uses contained switch tracks, capsule slider thumbs, separate crisp labels, pointer dragging, and reduced-motion-aware switch movement. It is an independent web interpretation, not a pixel-identical copy of iOS 27 or Apple’s private shader.

## Safari alignment fix

- Reproduced the reported detached lens and cropped background in Playwright WebKit 26.6 using the published preview's filter configuration. The scene was clipped by its page offset; changing only primitive bounds did not solve it.
- Replaced page-sensitive SVG coordinates with normalized source bounds, preserved pixel-based strength/blur, and placed clipped artwork in an inner stacking context. An attempted GPU-promoted inner layer was rejected after native Safari ignored its SVG filter.
- `npm test`: **16/16 passed**. `npx playwright test --project=chromium --project=webkit`: **12/12 passed**. The new pixel regressions require visible refraction inside the current box and preserve the surrounding scene, allowing sparse antialiasing differences. Coverage includes desktop frost pipeline changes plus 420 × 900 / 390 × 844 mobile layouts at DPR 3, lens movement, scrolling, resizing and map reuse.
- Native macOS Safari **27.2 (22625.2.5.11.1)**: visually confirmed the final demo's background remains complete and its refraction aligns with the overlay. This is separate from automated WebKit and does not establish physical iPhone/iPad compatibility.
- Firefox's bundled test browser failed before loading the app with **`Could not find profile folder.`** Changing the temporary profile location did not resolve the launch failure; Firefox validation remains incomplete.
- These checks used the local build. The existing hosted preview was inspected but has not been republished by this change.

## Earlier optical alpha checks

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
| Native macOS Safari | Earlier SVG demo check passed; new collection/media path awaits an unlocked Mac |
| Native iOS Safari / WebViews | Not run |
| Firefox | Browser launch failed before app validation; see error above |
| Automated Playwright WebKit | 18/18 tests passed, including media, components and optical regressions |
| React client mount/unmount and StrictMode | Chromium/WebKit mount, cleanup and remount passed |
| Sustained 60/120 FPS, GPU time, energy or mobile thermal behavior | Not measured |
| Whole-page/iframe capture and arbitrary compositor surfaces | Outside the contract; direct video/image/canvas inputs use the tested media module |

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
