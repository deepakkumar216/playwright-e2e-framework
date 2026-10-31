import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import { SAUCE_AUTH_FILE, SAUCE_URL, TASKS_PORT, TASKS_URL } from './src/config';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 7_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  // Baselines are per OS. CI uses the Linux ones (see .github/workflows/update-snapshots.yml).
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{platform}{ext}',

  // Blob reports from each shard are merged into one HTML report in CI.
  reporter: isCI
    ? [['blob'], ['github']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    // ---- saucedemo.com (public UI) ----
    {
      name: 'saucedemo-setup',
      testMatch: /saucedemo\/auth\.setup\.ts/,
      use: { baseURL: SAUCE_URL },
    },
    {
      name: 'saucedemo',
      testMatch: /saucedemo\/.*\.spec\.ts/,
      dependencies: ['saucedemo-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: SAUCE_URL,
        storageState: SAUCE_AUTH_FILE,
      },
    },

    // ---- local Tasks app (UI + REST API, data seeded through the API) ----
    {
      name: 'tasks-app',
      testMatch: /tasks-app\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: TASKS_URL },
    },
  ],

  webServer: {
    command: 'node demo-app/server.js',
    url: `${TASKS_URL}/health`,
    env: { PORT: String(TASKS_PORT) },
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
