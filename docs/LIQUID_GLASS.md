# Liquid Glass implementation decisions

Prism Glass 0.2 is an independent web implementation. The optical model and shader are authored here; Apple and Aave do not publish a normative shader that this package can claim to reproduce exactly.

The rendering split follows [Aave's public article](https://aave.com/design/building-glass-for-the-web): explicit live DOM through SVG, direct media through a shared WebGL renderer, and a portable shape map. Material placement and legibility follow [Apple's Materials guidance](https://developer.apple.com/design/human-interface-guidelines/materials) and [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/).

## Design contract

| Principle | Library behavior |
| --- | --- |
| Content and controls occupy separate layers | Original DOM/media remains the source; labels and native controls remain crisp HTML |
| Glass is a navigation/control material | Buttons, switches, sliders, tabs, toolbars, popovers and floating surfaces; examples avoid glass content cards |
| Regular and clear have distinct uses | Regular applies stronger frost/fill; clear is intended for media with bright foregrounds and local dimming |
| Avoid glass on glass | A surface/toolbar provides an overlay context; nested controls do not create additional refractive layers |
| Interaction feels responsive | Press lighting and pointer-local glow; switch/tab selections use a bounded spring; hit targets stay stable |
| Motion/transparency preferences matter | Reduced motion removes elastic feedback; transparency/contrast/forced-colors preferences use readable fallback fills |
| Semantics remain native | Buttons, range inputs, switch state, roving tabs, labeled panels and nonmodal popovers |
| Work scales with the actual source | Small SVG sources; bounded maps and output DPR; one uploaded media frame shared by every lens |

Use `GlassProvider` to choose a consistent variant and light/dark appearance. `appearance="auto"` follows the user's color-scheme preference. This does not read arbitrary DOM pixels to classify their brightness. Regular materials use a contrast-preserving fill; the application owns tone selection when its content requires a different choice. Media `clear` defaults to 0.35 local dimming, configurable for content that is already dark.

## Three explicit rendering modes

1. `svg-source`: a supplied `refractionTarget` or a control's own track is rendered through the SVG pipeline. Targets are decorative and inert. Low-level `createGlass`/`GlassSource` instead filter the original source DOM with its original listeners.
2. `webgl-media`: `GlassMediaScene` registers surfaces on one video/image/canvas texture. Lens positions, labels, and controls remain ordinary DOM; no copied video or page capture is involved.
3. `css-material`: with no explicit source, a surface uses browser blur/tint and lighting. It does not pretend to refract unrelated page content.

`data-prism-renderer` identifies the selected mode. GPU failure never converts a "ready" signal into a claim of visual correctness: media diagnostics report fallback/error/disabled separately. Import the stylesheet, keep the visible source below the canvas, and retain accessible foreground controls.

## Scope and visual reference

The media example follows the supplied reference's structure: a broad rounded media viewport, a large central playback lens, smaller skip controls, and a low capsule scrubber. All controls operate the real media. The bundled MDN CC0 clip is different footage from the Aave screenshot; no Aave media or brand assets are redistributed. The wider page is a component explorer, not a copy of the Aave article.

Implemented optical effects include shape-aware refraction, directional rim light, blur/frost, media chromatic fringe and touch lighting. The implementation does not claim Apple's private material physics, automatic DOM luminance analysis, arbitrary glass merging, spring morphing between unrelated silhouettes, video DRM capture, or a fixed frame-rate guarantee. Performance and physical iOS behavior must be assessed on the devices and content used by the application.
