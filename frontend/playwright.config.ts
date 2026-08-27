import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      // The account dialog only needs a syntactically valid auth origin to render.
      // Browser tests mock app requests and never contact this placeholder.
      VITE_NEON_AUTH_URL: process.env.VITE_NEON_AUTH_URL || 'https://auth.test.invalid',
    },
  },
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'], browserName: 'chromium' } },
    { name: 'iphone-safari', use: { ...devices['iPhone 15'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
});
