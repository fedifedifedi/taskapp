import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/taskapp_test';
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // La vidéo nécessite ffmpeg (installé en CI par `playwright install chromium`).
    video: isCI ? 'retain-on-failure' : 'off',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Permet d'utiliser un navigateur installé (ex. PW_CHANNEL=msedge) sans téléchargement.
        ...(process.env.PW_CHANNEL && { channel: process.env.PW_CHANNEL }),
      },
    },
  ],
  // Build de production servi par Express (API + SPA, même origine), comme sur Railway.
  // Le build est fait en amont par `npm run test:e2e`.
  webServer: {
    command: 'npm run db:deploy -w @taskapp/api && npm run start -w @taskapp/api',
    cwd: ROOT_DIR,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'production',
      PORT: String(PORT),
      DATABASE_URL,
      JWT_SECRET: 'e2e-secret-with-at-least-thirty-two-characters!',
      // Chaque test ouvre des sessions : on relève la limite anti force brute.
      AUTH_RATE_LIMIT_MAX: '10000',
      API_RATE_LIMIT_MAX: '10000',
      LOG_LEVEL: 'warn',
    },
  },
});
