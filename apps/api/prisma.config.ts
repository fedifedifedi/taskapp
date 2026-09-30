import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Optionnelle : `prisma generate` (build Docker, CI) n'a pas besoin de base de données.
  // Les commandes de migration échouent explicitement si DATABASE_URL est absente.
  ...(databaseUrl && { datasource: { url: databaseUrl } }),
});
