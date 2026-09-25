import { build } from 'esbuild';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const name of await readdir('dist')) if (name.endsWith('.js') || name.endsWith('.js.map')) await unlink(`dist/${name}`);
await build({ entryPoints: ['src/index.ts','src/react.tsx','src/optics.ts'], outdir: 'dist',
  bundle: true, splitting: true, format: 'esm', target: 'es2022', sourcemap: true, external: ['react'] });
await build({ entryPoints: ['src/index.ts'], outfile: 'dist/prism-glass.global.js',
  bundle: true, format: 'iife', globalName: 'PrismGlass', target: 'es2022', minify: true });
const demo = await build({ entryPoints: ['demo/main.ts'], bundle: true, format: 'iife',
  target: 'es2022', minify: false, write: false });
const template = await readFile('demo/template.html', 'utf8');
await writeFile('demo/index.html', template.replace('/* PRISM_DEMO_BUNDLE */',
  demo.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')));
console.log('Built ESM, declarations, browser bundle, and self-contained demo/index.html');
