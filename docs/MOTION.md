# Contact light and materialization

Prism Glass reproduces the **appearance** of contact illumination in the SDR range. It does not request HDR output, exceed the display's white level or claim to reproduce Apple's private shader.

## Official reference

- [Meet Liquid Glass, WWDC25](https://developer.apple.com/videos/play/wwdc2025/219/): contact illumination begins at the fingertip and spreads through the material and nearby glass; appearing/disappearing glass modulates bending/lensing. Reduced Motion reduces effect intensity and removes elastic motion.
- [SwiftUI interactive](https://developer.apple.com/documentation/swiftui/glass/interactive(_:)): opt-in native interaction behavior.
- [SwiftUI materialize](https://developer.apple.com/documentation/swiftui/glasseffecttransition/materialize): content fades while the material animates in/out, without matching another element's geometry.
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views): distinguishes materialization from matched geometry and shape merging.

A temporary SwiftUI app on the installed iOS 27 simulator was used to inspect native `.buttonStyle(.glass)` contact feedback and `.glassEffectTransition(.materialize)` with the default `withAnimation`. A native pressed screenshot and a frame-sampled native transition recording confirmed a bright softened contact region, a brief blurred content phase, and a dissolving/reforming material boundary. Native capture helpers and recordings stayed outside the package. The temporary app was removed afterward.

The timing, Gaussian weights and intensities here are calibrated web choices, **not published Apple constants**. This implements materialize and contact light; it does not claim matched-geometry transitions, glass unions or identical HDR luminance.

## Contact illumination

Existing glass components respond to pointer and keyboard input. The implementation combines a compact white core, a softer bloom, a low internal fill and a contact-sensitive rim. The WebGL path uses bounded screen-like color lifting; the CSS/SVG path uses layered light below the crisp foreground. Idle energy is zero. A short minimum excitation makes quick taps visible even if down/up arrive before a paint.

- The origin follows the contact point. Keyboard activation starts in the center.
- Dragging outside, pointer cancellation, disabling, focus loss and teardown release the effect.
- Unrelated pointer-up events cannot cancel another contact.
- Nearby surfaces receive a weaker response through one shared propagation pass. Different groups are isolated.
- Reduced Motion removes elastic flex and lowers light intensity; Increased Contrast/forced colors suppress decorative bloom.
- Hit boxes remain stable while the optical layer flexes. Switch/slider idle geometry is unchanged.

```tsx
import { GlassLightGroup, GlassButton } from '@meapri/prism-glass/react';

<GlassLightGroup style={{ display: 'flex', gap: 16 }}>
  <GlassButton>Save</GlassButton>
  <GlassButton>Share</GlassButton>
</GlassLightGroup>
```

An explicit group is preferred for surfaces in different wrappers. Otherwise, a media scene or immediate structural parent supplies the scope. `GlassLightGroup` coordinates light; it does not merge shapes.

## Appearing and disappearing

Use `GlassPresence` when the surface should unmount after its exit:

```tsx
import { GlassPresence } from '@meapri/prism-glass/react';

<GlassPresence present={open} preset="popover" onPresenceChange={setPhase}>
  <h2>Details</h2>
  <p>The content resolves as the material forms.</p>
</GlassPresence>
```

Use `present` on an existing `GlassSurface` or `GlassButton` to retain the DOM after hiding. Do not conditionally remove the component immediately if you want to see its exit. `GlassPresence` retains it for you.

One interruptible clock drives lensing, diffusion, tint, edge intensity, foreground opacity, foreground blur and a subtle content-scale resolve. The hit box is not animated. A new request reverses from the current progress. Completed optical maps are reused throughout materialization.

Closing immediately makes the surface inert, hidden from assistive technology and unable to intercept clicks; unmounting happens after the visual exit. Applications should restore focus to a stable trigger when closing from inside a custom panel. The demo does this. Native `GlassPopover` retains its existing light-dismiss, Escape and focus-return behavior and materializes automatically. Its top-layer exit uses discrete `display`/`overlay` transitions; older browsers without that support may close the native top layer immediately.

The web defaults are approximately 320ms in / 240ms out, scaled for partial reversals. Reduced Motion uses a short 80ms resolve with no size animation or foreground blur. Settled content removes its temporary filter/scale. No repeating animation runs at rest.

## Renderer-level use

```ts
import { createGlassPresence } from '@meapri/prism-glass';

const presence = createGlassPresence(surfaceElement, {
  visible: false,
  onFrame(frame) {
    media.updateLens('panel', { presence: frame.progress });
  }
});
presence.setVisible(true);
presence.setVisible(false);
presence.destroy();
```

`MediaLens.presence` is 0–1. Zero is optically neutral: the lens is omitted, leaving the original source untouched. Mid-transition values vary the optics; the displacement map is not regenerated. A DOM/SVG integration can apply `frame.lensing`, `frame.diffusion` and `frame.edge` to its configured strength, blur and highlight. The React adapters do this automatically.

Low-level `MediaLens.press`, `pointer`, `illumination`, and `illuminationPointer` are available for non-React interaction systems. `bindGlassInteraction` provides pointer/keyboard tracking and cleanup; `glassLightAt` and `glassPresenceFrame` are pure helpers. Destroy controllers when their owners unmount.

Try the live examples at `/#motion`: hold and move over Save/Share/More, toggle the glass rapidly, and open/close the popover.
