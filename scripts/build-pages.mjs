import { copyFile, mkdir, rm, writeFile,readdir } from 'node:fs/promises';

// Publish the generated demos, catalog and reviewed reference assets, never source/test files.
const output = new URL('../pages-dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(new URL('assets/', output), { recursive: true });
for (const name of ['index.html', 'optics.html', 'catalog.html', 'catalog-scene.html', 'assets/flower.mp4']) {
  await copyFile(new URL(`../demo/${name}`, import.meta.url), new URL(name, output));
}
await mkdir(new URL('assets/catalog/',output),{recursive:true});
for(const name of await readdir(new URL('../docs/visual/catalog/',import.meta.url))){
  if(/^[a-z0-9-]+\.png$/.test(name))await copyFile(new URL(`../docs/visual/catalog/${name}`,import.meta.url),new URL(`assets/catalog/${name}`,output));
}
await writeFile(new URL('.nojekyll', output), '');
console.log('GitHub Pages artifact: pages-dist/');
