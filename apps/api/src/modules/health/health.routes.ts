import { Router } from 'express';
import { logger } from '../../config/logger.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

/** Utilisé par Railway (healthcheck) : vérifie aussi la connexion à la base. */
export function createHealthRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ok', database: 'ok', uptime: Math.round(process.uptime()) });
    } catch (err) {
      logger.error({ err }, 'Healthcheck : base de données indisponible');
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  return router;
}
