import { createGlass, lensFor, type GlassController } from '../src/index.js';
const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
async function waitFor(test: () => boolean, message: string) {
  const start = performance.now();
  while (!test()) { if (performance.now() - start > 8000) throw new Error(`Timeout: ${message}`); await nextFrame(); }
}
export async function runChecks(host: HTMLElement, output: HTMLElement, button: HTMLButtonElement) {
  button.disabled = true; output.textContent = 'Running lifecycle checks…';
  const source = document.createElement('div'); source.className = 'test-fixture';
  const child = document.createElement('button'); child.textContent = 'Live button';
  const counter = document.createElement('span'); counter.textContent = 'Clicks: 0';
  let clicks = 0; child.addEventListener('click', () => { clicks++; counter.textContent = `Clicks: ${clicks}`; });
  source.append(child, counter); host.replaceChildren(source); source.scrollIntoView({ block: 'center' });
  const lens = { x: 60, y: 20, width: 120, height: 80, radius: 25 };
  let glass: GlassController | undefined; const lines: string[] = [];
  const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); lines.push(`PASS  ${message}`); output.textContent = lines.join('\n'); };
  const defsBefore = document.querySelectorAll('[data-prism-defs]').length;
  try {
    glass = createGlass(source, { lens, respectReducedTransparency: false });
    await waitFor(() => glass!.getDiagnostics().state === 'ready', 'initial render');
    assert(source.style.filter.includes('url('), 'A source filter is applied');
    assert(source.querySelector('button') === child, 'The original DOM node is preserved');
    assert(source.children.length === 2, 'No source subtree is cloned');
    child.click(); assert(clicks === 1, 'Original event handlers remain connected');
    const builds = glass.getDiagnostics().mapBuilds;
    for (let i = 0; i < 20; i++) glass.update({ lens: { x: i * 2 } });
    await nextFrame(); await nextFrame();
    assert(glass.getDiagnostics().mapBuilds === builds, 'Position updates reuse the map');
    glass.update({ strength: 0 }); await nextFrame(); await nextFrame();
    assert(glass.getDiagnostics().mapBuilds === builds, 'Strength updates reuse the map');
    glass.update({ lens: { radius: 18 } });
    await waitFor(() => glass!.getDiagnostics().mapBuilds > builds && glass!.getDiagnostics().state === 'ready', 'shape update');
    assert(glass.getDiagnostics().mapBuilds === builds + 1, 'A shape change builds one new map');
    let rejected = false; try { glass.update({ lens: { width: NaN } }); } catch { rejected = true; }
    assert(rejected && glass.getDiagnostics().state === 'ready', 'Invalid geometry is rejected atomically');
    rejected = false; try { createGlass(source, { lens }); } catch { rejected = true; }
    assert(rejected, 'Duplicate ownership is rejected');
    glass.update({ enabled: false }); await nextFrame(); await nextFrame();
    assert(source.style.filter === '' && glass.getDiagnostics().state === 'disabled', 'Disable restores the source');
    glass.update({ enabled: true }); await waitFor(() => glass!.getDiagnostics().state === 'ready', 'enable');
    assert(glass.getDiagnostics().mapBuilds === builds + 1, 'Re-enable reuses decoded maps');
    glass.update({ maxSourcePixels: 10_000 }); await nextFrame(); await nextFrame();
    assert(glass.getDiagnostics().state === 'limited' && source.style.filter === '', 'Source pixel budget suspends rendering');
    glass.destroy(); glass.destroy();
    assert(document.querySelectorAll('[data-prism-defs]').length === defsBefore && source.style.filter === '', 'Destroy is idempotent and removes owned DOM');
    glass = createGlass(source, { lens, respectReducedTransparency: false });
    glass.destroy(); // Dispose before the queued first render.
    await nextFrame(); await nextFrame();
    assert(document.querySelectorAll('[data-prism-defs]').length === defsBefore, 'Immediate destroy leaves no filter definitions');
    source.style.filter = 'none';
    glass = createGlass(source, { lens, respectReducedTransparency: false });
    await waitFor(() => glass!.getDiagnostics().state === 'ready', 'remount'); glass.destroy();
    assert(source.style.filter === 'none', 'Remount works and restores the original inline value');
    source.style.filter = '';
    glass = createGlass(source, { lens, refreshFilterId: 'always', respectReducedTransparency: false });
    await waitFor(() => glass!.getDiagnostics().state === 'ready', 'cache mode');
    const old = source.style.filter; glass.refresh(); await nextFrame(); await nextFrame();
    assert(source.style.filter !== old, 'Explicit cache invalidation changes the filter ID');
    source.style.filter = 'contrast(1.1)'; glass.destroy();
    assert(source.style.filter === 'contrast(1.1)', 'Cleanup preserves a later external filter edit');
    source.style.filter = '';
    glass = createGlass(source, { lens: lensFor('circle', { x: 60, y: 20, width: 80, height: 80 }),
      surface: 'dome', blurMode: 'center', blur: 2, respectReducedTransparency: false });
    await waitFor(() => glass!.getDiagnostics().state === 'ready', 'circle material');
    assert(glass.getDiagnostics().mapSize[0] === glass.getDiagnostics().mapSize[1], 'A circular material generates a square map');
    const materialBuilds = glass.getDiagnostics().mapBuilds;
    glass.update({ blur: 6 }); await nextFrame(); await nextFrame();
    assert(glass.getDiagnostics().mapBuilds === materialBuilds, 'Spatial frost strength reuses the material map');
    glass.update({ blurMode: 'edge' });
    await waitFor(() => glass!.getDiagnostics().mapBuilds === materialBuilds + 1 && glass!.getDiagnostics().state === 'ready', 'frost distribution');
    assert(glass.getDiagnostics().mapBuilds === materialBuilds + 1, 'Changing frost distribution regenerates its mask');
    lines.push(`\n${lines.length} checks passed. Visual fidelity and GPU timing require separate checks.`);
    output.dataset.result = 'passed'; output.textContent = lines.join('\n');
  } catch (error) {
    output.dataset.result = 'failed'; output.textContent = [...lines, `FAIL  ${error instanceof Error ? error.message : String(error)}`].join('\n');
  } finally { glass?.destroy(); button.disabled = false; }
}
