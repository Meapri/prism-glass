# Working on Prism Glass

This file governs changes to this repository. For **using the installed package in another app**, start with [llms.txt](llms.txt) and [the integration guide](docs/AI_INTEGRATION.md); do not edit `node_modules`.

## Product contract

- Deliver a reusable web library. `src/` must not import `demo/`, reference captures, app routes or demo assets.
- Core, optics and media entry points remain independent of React. `/react` is an optional client component adapter; keep its emitted `use client` boundary.
- Refraction requires an explicit DOM or readable media source. Without one, React surfaces provide CSS material. Never describe that fallback as arbitrary-page refraction.
- Preserve public props, controlled/uncontrolled behavior, native keyboard/focus semantics, cleanup, accessibility preferences and the distinct CSS/SVG/media fallbacks.
- Apple captures guide appearance, not claims of proprietary shader equivalence. OS-style compositions do not register native widgets, notifications or activities.

## Sources and generated output

- Runtime/API: `src/`; distribution settings: `package.json`, `scripts/build-library.mjs`.
- Consumer guidance: `docs/AI_INTEGRATION.md`; reusable code: `examples/recipes/`.
- Generated: `dist/`, `api.json`, `docs/API_REFERENCE.md`, `llms.txt`, `llms-full.txt`. Change their sources, then run `npm run build:lib`.
- Demo and native visual references remain in the repository/site. They must not enter the installable package. `npm pack` builds only the library and its guidance.
- `api.json` is generated from emitted declarations and verified against actual runtime exports. Public imports are the package entry points, never `dist/*` or `src/*` deep imports.

## Verification

- Runtime changes: `npm test`; relevant browser tests via `npm run test:browser -- ...`.
- Package, API, type or example changes: `npm run test:package` (archive/exports/declarations/AI docs) and `npm run test:consumers` (installs the tarball into isolated React/Vite and Next.js apps, typechecks, builds, tests hydration and interactions).
- Generated guidance changes: `npm run docs:check` after a build. Keep complete copyable examples typechecked through public package imports.
- Report exact commands/results and unverified platforms. A selected renderer, passing import or passing SSR alone is not an end-to-end integration result.
- npm registry publication is a separate action. Do not mark the package as registry-published merely because a tarball, source commit or Pages deployment exists.

## Delivery

Keep the README/AI guide/version/changelog consistent. Use an explicit package allowlist, preserve licenses, and verify archive contents. For a requested website update, publish `pages-dist/` only and verify the public files match the built artifact. Do not ship tests, dependency directories, native captures or private configuration in the package.
