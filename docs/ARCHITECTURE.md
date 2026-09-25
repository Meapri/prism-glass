# Rendering architecture

## Optical map

`optics.ts` computes rounded-rectangle signed distance, estimates the outward normal, evaluates a bounded squircle-dome slope, then uses a single refraction event to derive a normalized sample offset. It emits displacement, silhouette and directional highlight pixel maps. Coordinates outside the rounded silhouette are masked out. The center is neutral.

Only one quadrant evaluates signed distances and surface slopes; mirrored displacement and normals are written to the remaining quadrants, with directional lighting recomputed for each reflected normal. A full-grid reference test checks odd dimensions and all supported shapes.

Map generation is pure and bounded to at most 512 pixels per dimension. The strength is applied later by the SVG primitive or media shader, so changing strength does not regenerate pixel maps. Width, height, radius, shape, bevel, refractive index, surface, depth, curvature, frost distribution or resolution changes invalidate the map key.

Circles use radial distance; capsules use the rounded-rectangle distance with full caps; ellipses use a first-order signed-distance estimate with an exact silhouette and a guarded center. The normal follows that shape. Rim profiles preserve a flat center, dome profiles bend across the whole lens, and concave profiles reverse the bend. Depth changes the surface slope and curvature changes the dome exponent.

## SVG composition

The displacement map is delivered to `feImage` as a decoded PNG data URL. A color matrix maps integer channel 128 to exactly 0.5. The graph runs in sRGB. `SourceGraphic` feeds the distortion; a silhouette composite keeps the original pixels outside the lens. An optional blur supplies the distorted input. A separate narrow highlight is composited over the result. Only active blur/frost branches are mounted, so unused image inputs cannot invalidate the graph in WebKit. Image-load events schedule a repaint.

Center/edge frost adds a fourth map only when requested. It blends the sharp and blurred refracted branches, using complementary weights before applying the common silhouette. A zero blur uses the sharp branch directly; uniform blur uses the blurred branch directly. The varying frost is an opacity blend, not a physically varying Gaussian kernel. The optical playground does not add a CSS border, inset border-shadow or decorative inner arc around its main lens; its edge-light slider controls the optical highlight.

Both filter and primitive regions use `objectBoundingBox`. The full-source region is `(0,0,1,1)` and image rectangles normalize the CSS-pixel lens coordinates by source width/height. This avoids WebKit interpreting `userSpaceOnUse` relative to the page and clipping/offsetting the source. To keep displacement strength in CSS pixels on rectangular sources, the color matrix attenuates each channel by `min(width,height) / axisSize` and displacement scale uses `2 * strength / min(width,height)`. Blur similarly normalizes its X/Y standard deviations independently. Resizing updates these values without rebuilding the optical maps.

The demo places artwork in a clipped inner stacking context (`isolation: isolate`) inside an untransformed source wrapper. This prevents descendant overflow from expanding WebKit's reference bounds. Do not substitute `translateZ(0)`: native Safari can skip the SVG filter when its content is promoted to a GPU layer. Changing the filter ID remains configurable and automatic for WebKit. These measures do not establish support on every Safari/iOS version.

## Controller lifetime

One controller owns one source's filter. A weak set rejects duplicate ownership. State changes are batched into a single requested frame. A generation ticket prevents stale asynchronous PNG work from being committed after replacement or disposal. Map references are released on replacement or destruction. Resize, intersection, image-load, document visibility and reduced-transparency observers/listeners are detached on destruction.

The controller restores the original inline filter only while it still owns the current value; a later external edit is preserved. The optional React adapter owns the controller in an effect and cleans it up on unmount. The core has no top-level browser access.

## Performance decisions

- Motion updates the filter region/map placement, not map bytes.
- Map dimensions are independent of screen DPR.
- A source-pixel budget includes DPR²; exceeding it disables the effect visibly through diagnostics.
- Continuous invalidation is explicit (`live`); idle controllers do not run a perpetual frame loop.
- Filter cost still scales with source area, filter passes, changing source content, device and browser. No fixed FPS promise is made.

## Media renderer

`createMediaGlass` owns a dedicated transparent WebGL canvas. A single source texture supplies all lenses. Two small textures per unique optical shape hold displacement and finish channels; movement, tint, chroma and press lighting are uniforms. Active shapes share texture entries, and unused entries are released. Shape generation is the same CPU module used by the SVG path.

Each lens draws one bounded quad. The WebGL shader evaluates analytic signed-distance silhouettes and rim lighting, so long capsules retain smooth edges independently of map resolution. Source UVs account for cover/contain/fill, normalized object-position and letterbox/background color. Frost uses a bounded nine-tap kernel; media-only chromatic edging separates the red/blue samples slightly along displacement. Clear and regular materials keep foreground DOM separate from the pixels being bent.

Video updates use `requestVideoFrameCallback` with an animation-frame fallback. Layout and input changes request a draw without uploading the source again. Hidden/offscreen scenes and paused video stop continuous work. Output pixel count is capped by reducing backing-store DPR; source decode/upload costs still depend on the media dimensions. Texture limits, CORS errors and unavailable/lost contexts are explicit diagnostics. Context restoration rebuilds GPU resources. Teardown removes observers, input hooks and GPU resources.

## React material and controls

`GlassProvider` supplies a variant and appearance. `GlassSurface` creates a context that keeps nested controls in a simple foreground layer, avoiding glass-on-glass. Explicit refraction targets are inert decorative subtrees; the original `GlassSource` preserves the source-first low-level contract. With no explicit source, a surface identifies itself as CSS material.

`GlassMediaScene` registers child lens readers and coalesces their geometry updates without driving per-frame React renders. Button feedback and switch/tab springs update imperative lens/CSS state. Native inputs own slider semantics; tabs implement roving focus and linked panels; popovers use the browser top layer with focus restoration. Preference listeners are shared per window and removed after the last subscriber. SSR imports do not access browser globals.

## Remaining boundaries

The media path supports shared lenses; the DOM path still owns one lens per source. Automatic whole-page capture, arbitrary silhouette merging and background-luminance classification of unrelated DOM are not implemented. Device-specific quality profiles require measured visual/performance checks on the actual target hardware.
