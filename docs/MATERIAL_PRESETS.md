# Surface presets and adaptive appearance

The surface API covers the functional glass layer, from a compact action to a floating sheet. These presets are authored web values informed by [Apple's size and adaptivity explanation](https://developer.apple.com/videos/play/wwdc2025/219/); they are not an exhaustive catalog of Apple's private materials or published shader constants.

```tsx
<GlassSurface preset="navigation" appearance="adaptive">
  <nav>…</nav>
</GlassSurface>

<GlassSurface preset="sidebar" appearance="adaptive">
  <SidebarContent />
</GlassSurface>

<GlassMediaScene source={imageRef} appearance="adaptive" variant="regular">
  <img ref={imageRef} src="/photo.jpg" />
  <div className="prism-media-controls">
    <GlassSurface preset="popover" style={{ position: 'absolute', left: 40, top: 60 }}>
      <Details />
    </GlassSurface>
  </div>
</GlassMediaScene>
```

| Preset | Geometry / optical role | Adaptive behavior |
| --- | --- | --- |
| `navigation` | Quiet capsule, rounded optical band, continuous diffusion | Light/dark labels |
| `toolbar` | Compact shared action surface | Light/dark labels |
| `tab-bar` | Broader capsule and deeper edge | Light/dark labels |
| `search` | Shallow refraction with more text diffusion | Light/dark labels |
| `button` | Compact rounded edge | Light/dark labels |
| `floating-action` | Circle, fuller curvature and more elevation | Light/dark labels |
| `selection` | Thin shallow standalone capsule | Light/dark labels |
| `menu` | Rounded panel, wider bevel, more scattering | Stable appearance; tint/shadow adapt |
| `popover` | Raised panel with stronger edge separation | Stable appearance; tint/shadow adapt |
| `sidebar` | Large quiet center and ambient diffusion | Stable appearance; tint/shadow adapt |
| `sheet` | Largest bevel, optical depth and elevation | Stable appearance; tint/shadow adapt |
| `media` | Clear capsule with local dimming | Clear stays static, with white foreground |

Each profile defines curvature, depth, bevel, strength, diffusion, shape/radius and elevation. Optical bounds scale with the actual size and remain capped for small surfaces. Explicit `shape`, `radius`, `variant`, and optical overrides take precedence. A preset does not implement an entire navigation/sidebar/sheet interaction; your semantic HTML and application own those behaviors. Avoid a second glass layer inside a glass surface. The existing switch and slider visuals are unchanged.

## Framework-independent API

```ts
import { createGlass, resolveGlassSurface, glassSurfacePresets, getGlassPreset } from '@meapri/prism-glass';

import { createMediaGlass } from '@meapri/prism-glass/media';

const resolved = resolveGlassSurface('sheet', { width: 480, height: 360 });
// resolved.lens / optics / material / elevation / adaptation
const sourceFilter = createGlass(sourceElement, resolved.optics);
const renderer = createMediaGlass(overlayCanvas, image, {
  lenses: [{ id: 'actions', lens: resolved.lens, preset: 'menu', appearance: 'adaptive',
    onAppearance: ({ material }) => { label.style.color = material.foreground; } }]
});
```

`glassSurfacePresets` exposes immutable metadata for pickers. `getGlassPreset` also accepts the new names and returns just optical options; its existing switch/slider/tab/button/panel cases are preserved for compatibility. Use `resolveGlassSurface` when you need geometry and material together. The low-level source filter itself does not style foregrounds or infer a backdrop; use the observer below or the React surface adapter.

## Appearance modes

- `light` / `dark`: explicit application choice; background sampling is bypassed.
- `auto`: operating-system preference, preserving the existing behavior.
- `adaptive`: each surface samples its own background. Compact Regular surfaces switch appearance; large reading surfaces retain their OS/application reading appearance and adapt tint, diffusion and shadow. Clear retains its separate static media treatment.

The algorithm uses linear sRGB luminance, a 0.18–0.30 hysteresis band, time-based filtering and a 180ms candidate hold. It makes an initial choice immediately, then filters changes to avoid flashing. A contrast guard deepens or lightens the tint of stable reading surfaces when the sampled background would leave the foreground hard to read. Its 4.5:1 estimate uses sampled colors and variance; it is not a claim that every glyph over an arbitrary compositor surface has been contrast-audited. These thresholds are library calibration values. GPU material transitions interpolate without rendering React on every frame. Adaptive media diffusion is quantized to half-pixel steps to bound transient Gaussian texture allocation. Unchanged appearances do not repeatedly write CSS.

DOM surfaces share one observer scheduler per window, pause sampling while hidden/offscreen, and remove their timer/listeners after the final subscriber leaves. Stationary background changes and CSS animation are checked at a bounded cadence. Video/canvas/image lenses share one small pixel sampler per scene, refreshed at most roughly every 120ms except explicit source/geometry invalidation. No WebGL readback, page screenshot or network image fetch is used.

### What can be sampled

- Opaque and translucent CSS background colors, with alpha composition.
- Simple linear gradients (degree/basic-direction, color and percentage stops), and centered circle/ellipse radial gradients.
- Loaded `<img>`, `<video>`, and `<canvas>` elements with readable pixels and supported `cover`/`contain`/`fill` fitting.
- Direct media sources in `GlassMediaScene`, using the same source rectangle, object position and letterbox background as the renderer.

Arbitrary CSS background URLs, pseudo-element imagery, complex gradients, masks, blending groups, transformed/composited DOM and cross-origin/DRM pixels cannot be reliably reconstructed from DOM hit testing. They report unavailable and fall back to the selected OS/application appearance. The engine does not pretend to read those pixels. Use a direct media source or an explicit callback for such content:

```tsx
<GlassSurface preset="navigation" appearance="adaptive"
  backdrop={() => ({
    luminance: 0.12, variance: 0.01, color: [0.2, 0.3, 0.4],
    source: 'provided', confidence: 1
  })}>…</GlassSurface>
```

`backdrop` may also be an explicit DOM background/media element. It samples that element's own background/media rather than automatically rasterizing all descendants. With a decorative `refractionTarget`, provide its relevant background element or callback when it differs from the page behind the surface.

```ts
const observation = observeGlassBackdrop(element, sample => {
  state = updateGlassAdaptation(state, sample, performance.now(), 'light', 'flip');
  // Apply your foreground/material using the resolved state.
});
observation.refresh();
observation.destroy();
```

`data-prism-adaptation` on React surfaces is `resolved`, `unavailable`, `clear-static`, or `off`. This is separate from `data-prism-renderer` and media loading/error states.

### Static canvas sources

Increment `sourceVersion` after drawing into a static canvas so both its texture and adaptive sample refresh. For continuously drawn canvases, use `media={{live: true}}`. Video frame invalidation is automatic.

```tsx
<GlassMediaScene source={canvasRef} sourceVersion={revision}
  appearance="adaptive" variant="regular">…</GlassMediaScene>
```

The gallery at `/#materials` exercises all presets, real source pixels, stable large-surface labels, moving backgrounds, and ordinary scrolling HTML.
