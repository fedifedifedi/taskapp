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

  // Échéances relatives à aujourd'hui : en retard, aujourd'hui, à venir.
  const inDays = (days: number) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
  };

  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Lire le cahier des charges',
        status: 'DONE',
        completedAt: new Date(),
        dueDate: inDays(-2),
      },
      {
        userId: user.id,
        title: "Concevoir l'architecture",
        description: 'Monorepo, API Express, SPA React',
        status: 'IN_PROGRESS',
        dueDate: inDays(0),
      },
      {
        userId: user.id,
        title: 'Écrire les tests E2E',
        description: 'Playwright, Page Objects',
        status: 'TODO',
        dueDate: inDays(3),
      },
      {
        userId: user.id,
        title: 'Préparer la démo',
        description: 'Scénario de présentation au recruteur',
        status: 'TODO',
        dueDate: inDays(-1),
      },
      { userId: user.id, title: 'Configurer Railway', status: 'TODO' },
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
