# Package integration verification

Run the commands below from a source checkout of Prism Glass, not inside `node_modules` or an unrelated consumer app. To validate a consumer, use that application's own typecheck/build/test commands as described in the integration guide.

Use `npm run test:package` to inspect the actual archive, public exports, declarations, retained React client directive, license and generated guidance. This also checks that runtime entry points have no undeclared external dependency and that reference images/demo files do not enter the archive.

Use `npm run test:consumers` to pack and install the library into temporary projects outside the checkout. It copies the exact `examples/recipes/` files, typechecks using public package imports, runs production builds, and tests actual browser hydration, state changes, modal focus and the media renderer. No source alias, package transpilation exception or disabled typecheck substitutes for a successful consumer build.

The fixtures cover a plain React/Vite consumer and a Next.js App Router consumer. A separate core-only installation checks that importing core/media/optics does not install or require React. Fixture versions are pinned in `tests/consumers/`; this is evidence for those versions, not all framework releases or physical devices.

Commands install ordinary npm dependencies into temporary consumer directories. They never publish the package to npm or deploy the consumer applications. Temporary servers are stopped after testing. Detailed release results are recorded in [VALIDATION.md](VALIDATION.md).

## Recorded matrix (0.5.0-alpha.2)

| Consumer | Toolchain | Result |
| --- | --- | --- |
| Core only | npm, ESM, no React dependency | Install and pure core/media/optics imports passed |
| React/Vite | React 18.3.1, Vite 8.3.1, TypeScript 6.0.3 | Strict typecheck, production build, Chromium interactions passed |
| Next.js App Router | Next 16.3.6, React 19.3.0, TypeScript 6.0.3 | Server/client boundary, strict typecheck, production build, Chromium hydration/interactions passed |

Both UI fixtures verify the controlled switch/range, action/menu state, modal cancellation and focus restoration, and a mounted media source with an interactive dock. The imperative helper is typechecked alongside the recipes; the library's media browser suite tests its underlying renderer independently. Consumer servers shut down on success or failure. Re-run this matrix when changing exports, generated declarations, client boundaries, CSS packaging or examples.
