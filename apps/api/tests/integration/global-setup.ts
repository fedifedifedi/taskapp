import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from '../test-env.js';

/** Applique les migrations sur la base de test avant l'exécution des tests d'intégration. */
export default function setup() {
  const databaseName = new URL(TEST_DATABASE_URL).pathname.slice(1);

  // Garde-fou : les tests vident les tables, ils ne doivent jamais viser une autre base.
  if (!databaseName.includes('test')) {
    throw new Error(`Base de test refusée : "${databaseName}" (le nom doit contenir "test")`);
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
