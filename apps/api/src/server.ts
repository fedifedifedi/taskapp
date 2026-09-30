import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './lib/prisma.js';

const app = createApp({ prisma });

const server = app.listen(env.PORT, () => {
  logger.info(`API démarrée sur http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

let shuttingDown = false;

// Arrêt propre : Railway envoie SIGTERM lors d'un redéploiement.
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} reçu, arrêt en cours…`);

  const forceExit = setTimeout(() => {
    logger.error('Arrêt forcé après délai dépassé');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async (err) => {
    await prisma.$disconnect();
    if (err) {
      logger.error({ err }, "Erreur lors de l'arrêt du serveur");
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Promesse rejetée non gérée');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Exception non interceptée');
  process.exit(1);
});
