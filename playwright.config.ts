import { defineConfig, devices } from '@playwright/test';

const headless = process.env.HEADLESS?.toLowerCase() !== 'false';
const slowMo = Number(process.env.SLOW_MO ?? 0);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.AMAZON_BASE_URL ?? 'https://www.amazon.com',
    headless,
    launchOptions: {
      slowMo: Number.isFinite(slowMo) ? slowMo : 0,
    },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
