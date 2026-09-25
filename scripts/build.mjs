import { build } from 'esbuild';
import { mkdir, readFile, writeFile, readdir, unlink, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const name of await readdir('dist')) if (name.endsWith('.js') || name.endsWith('.js.map')) await unlink(`dist/${name}`);
await build({ entryPoints: ['src/index.ts','src/react.tsx','src/optics.ts','src/media.ts'], outdir: 'dist',
  bundle: true, splitting: true, format: 'esm', target: 'es2022', sourcemap: true, external: ['react'] });
await build({ entryPoints: ['src/index.ts'], outfile: 'dist/prism-glass.global.js',
  bundle: true, format: 'iife', globalName: 'PrismGlass', target: 'es2022', minify: true });
await build({ entryPoints: ['src/media.ts'], outfile: 'dist/prism-glass-media.global.js',
  bundle: true, format: 'iife', globalName: 'PrismGlassMedia', target: 'es2022', minify: true });
await copyFile('src/styles.css', 'dist/styles.css');
const demo = await build({ entryPoints: ['demo/main.ts'], bundle: true, format: 'iife',
  target: 'es2022', minify: false, write: false });
const template = await readFile('demo/template.html', 'utf8');
await writeFile('demo/optics.html', template.replace('/* PRISM_DEMO_BUNDLE */',
  demo.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')));
const library = await build({ entryPoints: ['demo/library.tsx'], bundle: true, format: 'iife', jsx: 'automatic',
  target: 'es2022', minify: false, write: false, loader: {'.webp':'dataurl'} });
const libraryTemplate = await readFile('demo/library.template.html', 'utf8');
const styles = `${await readFile('src/styles.css', 'utf8')}\n${await readFile('demo/library.css', 'utf8')}`;
await writeFile('demo/index.html', libraryTemplate.replace('/* PRISM_STYLES */', styles)
  .replace('/* PRISM_LIBRARY_BUNDLE */', library.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')));
console.log('Built core, React components, media renderer, styles, library demo, and optical playground');
for (const name of ['catalog','catalog-scene']) {
  const app=await build({entryPoints:[`demo/${name}.tsx`],bundle:true,format:'iife',jsx:'automatic',target:'es2022',minify:true,write:false,loader:{'.webp':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}});
  const css=`${await readFile('src/styles.css','utf8')}\n${await readFile(`demo/${name}.css`,'utf8')}`;
  await writeFile(`demo/${name}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prism Glass · ${name==='catalog'?'iOS 27 catalog':'Live component'}</title><style>${css}</style></head><body><div id="root"></div><script>${app.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script></body></html>`);
}
await mkdir('dist/licenses',{recursive:true});
await copyFile('node_modules/lucide-react/LICENSE','dist/licenses/lucide-react.txt');
