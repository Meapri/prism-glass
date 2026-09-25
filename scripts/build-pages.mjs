import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';

// Publish only the two generated demos and their media, never source/test files.
const output = new URL('../pages-dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(new URL('assets/', output), { recursive: true });
for (const name of ['index.html', 'optics.html', 'assets/flower.mp4']) {
  await copyFile(new URL(`../demo/${name}`, import.meta.url), new URL(name, output));
}
await writeFile(new URL('.nojekyll', output), '');
console.log('GitHub Pages artifact: pages-dist/');
