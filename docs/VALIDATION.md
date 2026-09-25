# Validation record

Date: 2026-09-25. Release: `0.3.0-alpha.1`.

## Adaptive material and surface preset checks

- `npm test`: **26/26 passed**. Added tests for sustained appearance changes, hysteresis, invalid samples, linear luminance, background variance, large-surface policy, Clear behavior and bounded preset geometry.
- Chromium + WebKit on macOS: **52/52 passed**. New regressions cover per-lens pixel adaptation, DOM updates, manual overrides, nested foreground inheritance, CSS gradients/alpha, unreadable background fallback, cross-origin pixel refusal, final-subscriber cleanup, static canvas texture invalidation and all twelve preset selections.
- IAB visual/interaction checks at 1280 × 720 and 390 × 844: navigation switches white/black labels with the background; menus keep their reading appearance; real HTML background changes adapt the sticky bar; the mobile preset picker and preview fit the viewport. No application console errors were observed.
- Upstream `liquid-glass-web` was read at GitHub commit `1613f8311dbc31bc2331afcfe51a143c56dd6308`; its local uncommitted changes were not incorporated. Only adaptive appearance is derived from it; see `NOTICE.md`.
- Native Safari CI now additionally checks the preset gallery's dark→light adaptive transition. Remote run results will be recorded after completion.

## Previous release (`0.2.0-alpha.2`)

### Checks

- `npm test`: **22/22 passed** on macOS. Covers optical geometry, material/tint validation, springs, preference listeners, map generation and server rendering/imports.
- `npm run test:browser -- --project=chromium --project=webkit`: **38/38 passed** on macOS. Covers optical pixels, real video playback/pause/seek, regular/clear switching, mobile layouts, input/keyboard behavior, RTL, popovers, StrictMode and fallbacks.
- New Gaussian regression verifies vertical source orientation, color blending at a boundary and suppression of repeated narrow lines. Other media regressions verify displacement only inside the lens, letterboxing, cached-map/texture reuse, atomic validation, pixel budgets and context recovery.
- Native iOS 27 SwiftUI and live browser material/controls were compared at equal CSS sizes in both light and dark appearances. See [reference evidence](IOS27_REFERENCE.md) and the root `design-qa.md` for comparison history and limits.
- The package builds with all core/media/React/CSS exports. The earlier alpha was also installed and exercised with React 18.3.1; the current suite uses React 19.3.0.
- Linux CI runs headed browsers under Xvfb and uses two workers to reduce software GPU contention. Static media pixel fixtures explicitly retain their WebGL drawing buffer for deterministic capture; production rendering keeps the ordinary discardable buffer. The actual video component tests use the production context.
- [CI run 36115073723](https://github.com/Meapri/prism-glass/actions/runs/36115073723), source `39fea2e`: **57/57 passed** across Chromium, Firefox and WebKit on Linux. Both jobs completed successfully.
- Native macOS Safari **26.6.2** in that run passed SVG and React media checks: **3,299** refracted pixels with blur/highlights disabled, **70,099** changed pixels between paused regular/clear media, all 20 source lifecycle checks, switch state and keyboard slider input.
- The generated `0.2.0-alpha.2` tarball installed in a clean temporary consumer, and core/media/optics/CSS exports resolved successfully. No npm registry publication was performed.
- IAB checks confirmed regular tint adjustment, light/dark switching and popover placement at 390 × 844, with no application console errors.

## Known limits

- The native iOS app is a **design reference**, not evidence of the web library running in physical iOS Safari.
- Physical iPhone/iPad Safari/WebViews, native OS accessibility combinations, GPU energy/thermal behavior and sustained 60/120 FPS are not established.
- A matching static scene does not prove Apple's private shader or native morph timing has been reproduced.
- Local Firefox cannot start with its current profile environment; the Linux CI result is used for Firefox validation.
- `visualSupportVerified` remains `false` intentionally: selecting a renderer is not proof of pixel correctness on an arbitrary device.

## Earlier Safari work preserved

The source renderer keeps normalized `objectBoundingBox` filter bounds and isolated clipped artwork. Those changes corrected page-offset refraction and preserved visible displacement in native Safari. The macOS CI optical test still requires more than 300 changed pixels with blur and highlight disabled and runs all 20 lifecycle checks. Do not replace the artwork isolation with `translateZ(0)`; native Safari previously stopped rendering the SVG effect on that layer.

## Reproduce

```sh
npm ci
npm test
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
node scripts/build-calibration.mjs
node scripts/serve.mjs
```

Open `/calibration.html` for reference comparison, `/` for components, and `/optics.html` for low-level optics. Native Safari automation uses `python tests/native-safari.py` on a macOS runner with Safari Remote Automation enabled. No physical iOS pass is implied by Playwright WebKit.
