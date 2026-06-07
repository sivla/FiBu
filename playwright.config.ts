import { defineConfig } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './playwright/projects',
  timeout: 240_000,
  expect: {
    timeout: 20_000
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    headless: false,
    viewport: { width: 1920, height: 1080 },
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
});
