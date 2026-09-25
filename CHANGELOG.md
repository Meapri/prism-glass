# Changelog

## 0.4.0-alpha.1

- Correct overly weak refraction: use native-image-fitted rounded optical fields and reduce Clear diffusion from 2.5 to 1.5; separate Regular diffusion by shape/appearance.
- Recalibrate all twelve surface presets without changing switch/slider geometry or transient optics.
- Match native materialize frame progression more closely: remove content scaling and double-eased entry, delay text sharpening, and fit distinct entry/exit timing.

- Add localized SDR contact light, soft bloom, rim response and scoped neighboring illumination across CSS/SVG and media glass.
- Preserve visible feedback for quick taps; support pointer movement/cancellation, keyboard contact, disabled controls and cleanup.
- Add interruptible materialization through `GlassPresence`, `present`, and a framework-independent presence controller.
- Animate lensing, diffusion, tint/edges and content resolve separately, with optically neutral hidden media and reused optical maps.
- Animate native popovers while retaining light dismissal, focus return and immediate input exclusion on close.
- Honor reduced-motion and contrast preferences. Add a working light/motion playground and native Safari checks.

## 0.3.0-alpha.1

- Add twelve semantic surface presets with size-aware geometry, curvature, optical depth, refraction, diffusion and elevation.
- Port only the adaptive-appearance approach from Meapri/liquid-glass-web at `1613f83`; retain MIT attribution and refactor into shared pure state/color logic and bounded browser samplers.
- Add real per-lens media pixel sampling, CSS alpha/gradient sampling, temporal filtering, hysteresis and explicit unavailable-source fallback.
- Distinguish compact Regular light/dark switching, stable large reading surfaces, and static Clear materials.
- Add a preset gallery, background/appearance/position controls, live backdrop example and a scrolling HTML example.
- Add `sourceVersion` for static canvas invalidation. Preserve existing switch/slider geometry and behavior.
- Verify adaptive transitions, source pixels, opaque fallback, observer teardown and native Safari behavior.

## 0.2.0-alpha.2

- Calibrate regular/clear materials against native iOS 27 SwiftUI captures; retain Aave only as the rendering-architecture reference.
- Replace oversized dome defaults with narrow refraction, broad regular diffusion, neutral light/dark tints and directional edge lighting.
- Add cached separable Gaussian media diffusion and saturation control; retain source orientation, bounded textures and context cleanup.
- Match native capsule switch/slider thumbs, system green/blue, segmented selection, standard typography and separate visual/hit bounds.
- Add a 0–1 regular tint preference to providers, surfaces and media scenes; update the demo with working material/tint controls.
- Add native reference captures, a reproducible comparison fixture, Gaussian pixel tests and native Safari media verification.
