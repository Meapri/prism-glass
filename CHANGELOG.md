# Changelog

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
