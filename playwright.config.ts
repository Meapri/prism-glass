import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure', headless: process.env.PRISM_HEADED !== '1' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: 'node scripts/serve.mjs', port: 4173, reuseExistingServer: false },
});
