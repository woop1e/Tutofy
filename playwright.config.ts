import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],

  projects: [
    // Fast API-only tests — no browser, runs in seconds
    {
      name: 'api',
      testMatch: ['**/suite.spec.ts', '**/quiz-api.spec.ts', '**/quiz-validations.spec.ts'],
      use: { baseURL: 'http://localhost:8080' },
    },

    // UI tests — slower, run only when needed
    {
      name: 'ui',
      testMatch: ['**/quiz-week.spec.ts', '**/homework-week-calendar.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
        headless: false,
        launchOptions: { slowMo: 200 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },

    // Certificate flow — visual E2E test
    {
      name: 'certificate',
      testMatch: ['**/certificate-flow.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
        headless: false,
        launchOptions: { slowMo: 400 },
        screenshot: 'on',
        video: 'on',
      },
    },
  ],
});
