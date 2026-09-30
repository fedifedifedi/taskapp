// Base dédiée aux tests : jamais la base de développement.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/taskapp_test';

// Variables définies avant le chargement de src/config/env.ts ; dotenv ne les écrase pas.
export const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters!',
  JWT_EXPIRES_IN: '1h',
  AUTH_RATE_LIMIT_MAX: '10000',
  API_RATE_LIMIT_MAX: '10000',
  LOG_LEVEL: 'silent',
};
