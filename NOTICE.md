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

The local demo's `demo/assets/flower.mp4` is MDN's CC0 example media:
https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4
The originating example repository's license is CC0 1.0 Universal:
https://github.com/mdn/interactive-examples/blob/main/LICENSE
This demo asset is not part of the published package files. No Aave video or Apple artwork is bundled.
