import { defineConfig } from 'vite';
export default defineConfig({
  root: 'demo',
  server: { host: '0.0.0.0', port: 4173, strictPort: true, allowedHosts: ['terminal.local'] },
});
