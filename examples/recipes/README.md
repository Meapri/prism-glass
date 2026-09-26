# Copyable consumer recipes

These files import the installed package by name. They do not import repository source, demo code or reference imagery. Install the tarball and import `@meapri/prism-glass/styles.css` once in the app before using them.

- [ControlsExample.tsx](ControlsExample.tsx): controlled switch/slider, action state and a menu.
- [ConfirmExample.tsx](ConfirmExample.tsx): actual modal confirmation, cancel and focus restoration.
- [MediaDock.tsx](MediaDock.tsx): caller-owned image source and a clear interactive dock. Pass `src` for an image hosted by your app; dimensions are included.
- [plain-media.ts](plain-media.ts): framework-independent mounting, image readiness and cleanup. The source image must already be mounted in the supplied host.

React recipes include `use client` for Next.js and work in ordinary React applications. Event handlers stay inside the client boundary. The package's consumer suite copies these exact files into separate installations, typechecks them, builds and tests them; see [integration verification](../../docs/INTEGRATION_TESTS.md).

For the imperative recipe, supply a positioned host and match the image fit:

```html
<div id="scene" style="position:relative;width:600px;height:320px">
  <img id="picture" src="/your-image.jpg" alt="" style="width:100%;height:100%;object-fit:cover">
</div>
```

```ts
import {mountMediaLens} from './plain-media';
const instance=await mountMediaLens(
  document.querySelector<HTMLDivElement>('#scene')!,
  document.querySelector<HTMLImageElement>('#picture')!,
);
// On route/component teardown:
instance.destroy();
```
