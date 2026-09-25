# iOS 27 component and rendering QA — 0.5.0-alpha.1

The material QA record below remains as versioned history. This release adds the full HIG coverage inventory, component families, the transparent dock and high-density media maps.

## Current comparisons

The catalog places native iOS 27 photo captures next to live 402 × 812 scenes, with separate light/dark images. Real SwiftUI references cover eleven families: buttons, inputs, wheel/calendar, navigation/toolbars, tabs, menus, alerts, action sheets, popovers, sheets and standard materials. The complete inventory contains 64 HIG entries plus four compositions/foundations. Base references are explicitly labeled; absent native state/background captures are not represented as verified matches.

- **Fixed:** low-density 8-bit media displacement. Packed 16-bit coordinates, denser DPR-aware maps, analytic coverage and field continuation outside the silhouette remove the large quantization step and broken last-edge sampling. Circle coordinate error at strength 64 is below 0.002 CSS pixels in the numeric regression. Whole-image equivalence is not inferred from this number.
- **Fixed:** press-time field churn. Resting optical curvature stays constant during uniform flex, normalized geometry keys and a bounded cache reuse maps. Actual pointer press/release allocation checks cover the Clear dock.
- **Fixed:** dock transparency and shape. Local dimming is zero, white reflection is 3.5%, icons retain opacity and continuous corners follow a native mask-derived approximation.
- **Fixed:** menu icons/order, overlap anchoring, panel width and divider metrics; sheet heading/handle spacing; navigation trailing alignment; mobile header overflow.
- **Fixed:** modal return-focus targets for Safari pointer activation; native dialog input isolation; menu roving focus/disabled/checked behavior; sheet detent keyboard actions.
- **Remaining:** native glyph differences, fine local vibrancy and edge intensity, exact OS transition choreography/glass unions, and physical-device performance. The catalog includes functional web compositions for OS experiences, without claiming OS registration or delivery.

Five-point review: system typography and 44px control hit targets; same registered source coordinates in native comparisons; distinct Clear/Regular/standard materials; original CC0 media; ordinary semantic interactive content. Saved native reference screenshots never supply the live rendering.

Current test results and publication status are in [docs/VALIDATION.md](docs/VALIDATION.md). Native simulator reference capture is separate from web-browser verification.

---

# Native iOS 27 material QA

Date: 2026-09-25. Release: 0.4.0-alpha.1. Scope: material optics, contact light and materialization of this web library.

The earlier 0.2 static pass is superseded. It missed overly weak refraction and did not establish native animation fidelity. Functional test success is not evidence of visual equivalence.

## Source and comparison

- `docs/visual/NativeReference.swift` runs native `.glassEffect(.regular/.clear)`, `.buttonStyle(.glass)` and `.glassEffectTransition(.materialize)` on iOS 27.0 (24A434), built with Xcode 27.0.
- Registered native material crops are 402 × 675. `comparison-light.jpg` and `comparison-dark.jpg` place native on the left and current web on the right at identical bounds, source pixels and label content. IAB was used for visual inspection; saved comparisons use deterministic Chromium captures at CSS scale.
- `comparison-materialize.jpg` and `comparison-dematerialize.jpg` place native recorded frames above renderer samples at matching elapsed times. The 310 × 176 panel uses the same source crop and 28px radius. First optical changes are aligned within one native frame. This is appearance calibration; real-time lifecycle and interruption have separate browser tests.
- Existing `comparison-controls.jpg` records the unchanged switch/slider/control geometry from 0.2. It is not new motion evidence.

## Findings

1. **P1 fixed — refraction was nearly invisible.** The old 7/9/4 strength/bevel/curvature combination concentrated displacement in a few pixels at the boundary. Clear diffusion masked it. The new size-aware roundover bends visible background features through a broader band while keeping the center quiet. A browser pixel regression compares the Clear circle against its native crop and against the former profile.
2. **P1 fixed — excessive diffusion.** Clear uses 1.5px small-kernel diffusion. Regular defaults separate circular (8px), capsule (12px), light panel (14px) and dark panel (10px) treatments before preset multipliers. Removed the excessive base-plus-panel multiplication. The media demo opens with Clear, appropriate for bold white controls over rich imagery.
3. **P1 fixed — awkward entry/exit.** Removed content scaling and double-eased entry. Native frame inspection informed a gradual 340ms entry, faster 270ms exit and late text sharpening. Intermediate optical formation and blurred labels are visible in both comparison rows. Reversals preserve current progress; closing makes content inert immediately.
4. **P2 fixed — large dark panels were too bright and saturated.** Reduced reflected neutral fill and vibrancy with panel extent, using the native panel captures as the reference. Compact controls retain their own appearance.
5. **P3 remaining — fine native compositor differences.** Edge luminance, context-dependent local color adaptation, text/SF Symbol rasterization and recorded-frame timing vary. The public API does not reveal Apple's shader. These scoped comparisons do not establish pixel identity, native glass unions, HDR output or physical iPhone performance.

## Five-point fidelity check

- Typography: same system-font family, copy, alignment and line breaks in comparisons; foreground is crisp at rest and blurred only during transition.
- Spacing/layout: equal source/shape bounds and radii; stable hit boxes; no materialize size pulse. Switch/slider geometry and transient optical profiles are held constant.
- Color/material: separate Clear/Regular treatments and light/dark references; source-aware adaptation retains its earlier behavior and explicit fallback.
- Imagery: original CC0 flower frame, lossless native source crops, no generated substitute. Reference screenshots are never used as product rendering.
- Content: native comparison labels match; product copy describes an independent web implementation and does not claim Apple's private shader.

## Interaction and verification

Contact light follows the press origin, softly reaches nearby scoped glass and releases on cancel, blur, disabled state or cleanup. Quick taps have an immediate excitation. Keyboard activation is centered; Reduced Motion removes flex and foreground blur; contrast modes suppress bloom.

The browser suite covers real video controls, optical pixels, source alignment, context recovery, adaptive sampling, offscreen/resizing behavior, StrictMode cleanup, popover focus, immediate exit input exclusion and interrupted transitions. Final counts and CI links are in `docs/VALIDATION.md`. Native macOS Safari is a separate browser check, not a physical iOS test.

- [x] Same-state native and implementation comparisons inspected.
- [x] P1/P2 visual findings corrected and compared again.
- [x] Actual native feature displacement has an automated regression.
- [x] Entry and exit were assessed as frame sequences.
- [x] Platform and compositor differences remain explicit.

Final result: passed for the scoped optical/interaction checks above; pixel-identical native rendering is not asserted.
