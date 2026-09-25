# Provenance

Prism Glass is an independent implementation of a public rendering technique:
ordinary SVG filters applied to the chosen DOM source, with a lens-local displacement map and unchanged pixels outside the lens.

Conceptual references:
- Aave Labs, *Building Glass for the Web*: https://aave.com/design/building-glass-for-the-web
- Sam Asante, *liquid-glass* documentation and source were reviewed during research: https://github.com/samasante/liquid-glass
- W3C, *Filter Effects Module Level 1*: https://www.w3.org/TR/filter-effects-1/

No source files from those projects are included or copied. The SVG graph, geometry functions, controller, demo and adapters here were authored for this project. Snell's law, signed-distance geometry and SVG filter primitives are general techniques. No affiliation with Apple or Aave is implied. The package and project names are provisional.

The distributed core has no runtime dependency. React is an optional peer only for the `/react` entry point. Development tools retain their own licenses in the package manager's dependency metadata.

Additional design references for the component library:
- Apple, *Materials*: https://developer.apple.com/design/human-interface-guidelines/materials
- Apple, *Meet Liquid Glass*: https://developer.apple.com/videos/play/wwdc2025/219/

The local demo's `demo/assets/flower.mp4` is MDN's CC0 example media. `flower-still.webp` is a lossless frame extracted at 2 seconds for the static motion example:
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
The originating example repository's license is CC0 1.0 Universal:
https://github.com/mdn/interactive-examples/blob/main/LICENSE
This demo asset is not part of the published package files. No Aave video or Apple artwork is bundled.

## Adaptive appearance derivation

The backdrop sampling, shared scheduling and hysteresis approach in `src/adaptive.ts` and `src/backdrop.ts` is derived from the adaptive-appearance portion of [Meapri/liquid-glass-web](https://github.com/Meapri/liquid-glass-web), commit `1613f8311dbc31bc2331afcfe51a143c56dd6308`, `src/core/LiquidGlass.ts` (`parseBgLuminance`, `sampleBackdropLuminance`, `adaptToBackdrop`, and backdrop scheduling).

Copyright (c) 2026 Meapri. MIT licensed; the complete MIT permission and warranty notice is retained in this package's `LICENSE`.

Only the adaptive-appearance approach is incorporated. The upstream renderer, optical profiles, interactions, morphing and unrelated modules are not imported. Prism's implementation separates pure color/state logic from browser sampling, uses linear-light luminance and alpha composition, samples media pixels, adds temporal filtering/dwell, and fully detaches shared observers. The surface preset values are independently authored web approximations of Apple's qualitative guidance.
