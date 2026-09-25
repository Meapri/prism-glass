import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
const args = [cli, 'test', ...process.argv.slice(2)];
// Firefox's Linux headless compositor may not expose WebGL. Use the virtual
// display installed with Playwright's CI dependencies to test actual rendering.
const virtualDisplay = process.platform === 'linux' && Boolean(process.env.CI);
const result = virtualDisplay
  ? spawnSync('xvfb-run', ['--auto-servernum', '--server-args=-screen 0 1280x1024x24', process.execPath, ...args], {
      stdio: 'inherit', env: { ...process.env, PRISM_HEADED: '1' },
    })
  : spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
