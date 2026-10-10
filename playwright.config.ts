import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 7000 },
  reporter: 'list',
  use: {
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    baseURL: 'http://127.0.0.1:4175/number-trouble/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve-test.mjs',
    url: 'http://127.0.0.1:4175/number-trouble/',
    reuseExistingServer: !process.env.CI,
  },
});
