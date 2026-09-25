import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  // Headed browsers share the CI X display. Concurrent windows steal focus and
  // correctly cancel active presses via blur, invalidating held-pointer tests.
  workers: process.env.PRISM_HEADED === '1' ? 1 : process.env.CI ? 2 : undefined,
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure', headless: process.env.PRISM_HEADED !== '1' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: 'node scripts/serve.mjs', port: 4173, reuseExistingServer: false },
});
