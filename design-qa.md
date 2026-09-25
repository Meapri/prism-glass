# Native iOS 27 material QA

Date: 2026-09-25. Scope: web component/material fidelity, not a replica of native application chrome.

**Source visual truth**

- `docs/visual/NativeReference.swift`, executed on iOS 27.0 (24A434), Xcode 27.0.
- `docs/visual/native-materials-light.png` and `native-materials-dark.png`: 402 × 675 normalized crops from 1206 × 2025 native content at DPR 3.
- `docs/visual/native-controls.png`: 402 × 200 focused control montage from the same native app, with each crop at 1 CSS pixel per point.

**Implementation evidence**

- Local `/calibration.html` and `?dark`, in the Codex in-app browser. Viewport 1280 × 720, runtime DPR 2, capture output normalized by the browser to 1×.
- `docs/visual/comparison-light.jpg`, `comparison-dark.jpg`: 804 × 675, native 402px column on the left and rendered 402px column on the right in the same capture.
- `docs/visual/comparison-controls.jpg`: 804 × 200, native and rendered controls together at equal scale. Native controls were rearranged into this montage solely to compare component geometry.
- Same source pixels, crop, component bounds, labels, appearance and idle state. The calibration page is a test fixture, not a product screen with a rasterized native UI.

**Comparison history and findings**

1. [P1, fixed] The earlier demo used large dome distortion and green decorative styling. Native capture showed restrained rims, neutral fill and capsule control thumbs. Changed regular/clear profiles, component bounds, font weights, system colors and demo proportions. The current comparison images show the corrected family.
2. [P1, fixed] First same-background IAB comparison showed insufficient clear reflection and a flat-looking boundary. Measured the source/target color response, added modest diffusion/reflection, and adjusted the dark contour and directional specular edge. A second comparison found an overly uniform bright outline; reduced it and concentrated the glint at top/bottom. Current light/dark captures show a fine directional boundary.
3. [P2, fixed] Initial dark fill suppressed the background colors too strongly. Fitted native dark captures separately and changed the neutral tint/saturation response. Current dark comparison retains red/green ambient colors.
4. [P2, fixed] Focused controls had stronger shadows and a smaller segmented selection than the native reference. Softened thumb/button shadows and increased the segmented background/selection to 32/28px. The final focused comparison was captured after this change.
5. [P3, accepted] Subpixel edge details, local adaptive coloration and font/SF Symbol rasterization differ slightly between browser and native compositor. Public APIs do not expose Apple's private shader; this is a calibrated implementation, not an exact shader reproduction. Native dynamic morphing is not asserted by static captures.

**Required fidelity surfaces**

- Fonts/typography: system font first; regular 17px buttons, 13px segmented labels, medium/semibold only where present in the reference. Matched copy, line breaks and text alignment. Browser/native font rasterization remains a platform difference.
- Spacing/layout: equal material bounds and radii in the fixture; control hit boxes stay 44px while visuals match measured native dimensions. Native app navigation and page layout are intentionally outside this component comparison.
- Colors/tokens: black/white foregrounds, neutral regular fills, clear dimming, `#34c759` switch, `#0088ff` slider; separate light/dark calibration. No Aave green styling remains in the component demo.
- Image quality: identical CC0 frame, crop and scale; native source captured losslessly, web evidence returned as JPEG by the browser. No generated substitute or imitation artwork was used.
- Copy/content: reference fixture labels match. Demo copy describes a web component library and does not claim to be an Apple application.

**Interaction and accessibility checks**

Automated Chromium/WebKit checks cover playback, seek, material switching, button/switch/range inputs, tab keys, RTL, disabled tabs, popover placement/focus return, reduced motion, increased contrast, unavailable WebGL and context restoration. IAB comparison console had no application errors. Physical iOS Safari and native press/morph timing are not established by this run.

**Implementation checklist**

- [x] Native reference captured and density normalized.
- [x] Source and implementation inspected in combined full-view and focused comparisons.
- [x] P1/P2 findings fixed and compared again.
- [x] Material and control tests pass locally.
- [x] Remaining platform differences stated explicitly.

final result: passed
