import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [
    ['list'],
    // Allure reporter writes to ./allure-results
    ['allure-playwright', { detail: true, outputFolder: 'allure-results', suiteTitle: false }],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL: 'https://www.booking.com',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
});
