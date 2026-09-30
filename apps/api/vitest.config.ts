import { defineConfig } from 'vitest/config';
import { testEnv } from './tests/test-env.js';

export default defineConfig({
  test: {
    environment: 'node',
    env: testEnv,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/server.ts', 'src/types/**'],
      reporter: ['text-summary', 'html'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/global-setup.ts'],
          // Une seule base partagée : les fichiers s'exécutent l'un après l'autre.
          fileParallelism: false,
          testTimeout: 15_000,
        },
      },
    ],
  },
});
