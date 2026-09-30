/* eslint-disable no-console */
import { hashPassword } from '../src/lib/password.js';
import { prisma } from '../src/lib/prisma.js';

const DEMO_EMAIL = 'demo@taskapp.local';
const DEMO_PASSWORD = 'Demo12345';

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: 'Utilisateur démo', passwordHash },
  });

  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Lire le cahier des charges',
        status: 'DONE',
        completedAt: new Date(),
      },
      {
        userId: user.id,
        title: "Concevoir l'architecture",
        description: 'Monorepo, API Express, SPA React',
        status: 'IN_PROGRESS',
      },
      { userId: user.id, title: 'Écrire les tests E2E', description: 'Playwright', status: 'TODO' },
    ],
  });

  console.log(`Seed terminé : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
