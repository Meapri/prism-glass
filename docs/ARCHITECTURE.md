# Rendering architecture

## Optical map

`optics.ts` computes rounded-rectangle signed distance, estimates the outward normal, evaluates a bounded squircle-dome slope, then uses a single refraction event to derive a normalized sample offset. It emits displacement, silhouette and directional highlight pixel maps. Coordinates outside the rounded silhouette are masked out. The center is neutral.

Map generation is pure and bounded to at most 512 pixels per dimension. The strength is applied later by the SVG primitive, so changing strength does not regenerate pixel maps. Width, height, radius, shape, bevel, refractive index, surface, depth, curvature, frost distribution or resolution changes invalidate the map key.

Circles use radial distance; capsules use the rounded-rectangle distance with full caps; ellipses use a first-order signed-distance estimate with an exact silhouette and a guarded center. The normal follows that shape. Rim profiles preserve a flat center, dome profiles bend across the whole lens, and concave profiles reverse the bend. Depth changes the surface slope and curvature changes the dome exponent.

## SVG composition

The displacement map is delivered to `feImage` as a decoded PNG data URL. A color matrix maps integer channel 128 to exactly 0.5. The graph runs in sRGB. `SourceGraphic` feeds the distortion; a silhouette composite keeps the original pixels outside the lens. An optional blur supplies the distorted input. A separate narrow highlight is composited over the result.

Center/edge frost adds a fourth map only when requested. It blends the sharp and blurred refracted branches, using complementary weights before applying the common silhouette. A zero blur uses the sharp branch directly; uniform blur uses the blurred branch directly. The varying frost is an opacity blend, not a physically varying Gaussian kernel. The demo does not add a CSS border, inset border-shadow or decorative inner arc around the main lens; its edge-light slider controls the optical highlight.

Filter region origin remains `(0,0)` and covers the source, because the original DOM must remain visible outside the lens. The renderer deliberately does not transform the filtered source. Changing the filter ID is configurable and automatic for WebKit's known cache behavior. Embedded PNGs carry both href forms; SVG image load events invalidate the output. Unused blur/frost branches are detached, and intermediate primitive bounds stay in source coordinates. This path passed native Safari 26.6.2 regression tests; see the validation record for device limits.

## Controller lifetime

One controller owns one source's filter. A weak set rejects duplicate ownership. State changes are batched into a single requested frame. A generation ticket prevents stale asynchronous PNG work from being committed after replacement or disposal. Map image references are released on replacement or destruction. Resize, intersection, document visibility and reduced-transparency observers are detached on destruction.

The controller restores the original inline filter only while it still owns the current value; a later external edit is preserved. The optional React adapter owns the controller in an effect and cleans it up on unmount. The core has no top-level browser access.

## Performance decisions

- Motion updates the filter region/map placement, not map bytes.
- Map dimensions are independent of screen DPR.
- A source-pixel budget includes DPR²; exceeding it disables the effect visibly through diagnostics.
- Continuous invalidation is explicit (`live`); idle controllers do not run a perpetual frame loop.
- Filter cost still scales with source area, filter passes, changing source content, device and browser. No fixed FPS promise is made.

## Next modules

1. A shared-source multi-lens compositor, after validating masks and overlapping optical regions.
2. Explicit `GlassScene` / mirror ownership for panels over a chosen background; no silent whole-page cloning.
3. A shared WebGL renderer for direct image/video/canvas inputs, including context-loss recovery.
4. Quality profiles driven by measured visual/performance checks on native Safari/iOS, Firefox and Chromium.
5. Optional chromatic dispersion and motion helpers without increasing the minimal core's default pass count.
