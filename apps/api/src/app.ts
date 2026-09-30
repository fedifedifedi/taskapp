import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinoHttp } from 'pino-http';
import { env, isProduction } from './config/env.js';
import { logger } from './config/logger.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { originCheck } from './middlewares/origin-check.js';
import { createApiLimiter, createAuthLimiter } from './middlewares/rate-limit.js';
import { createAuthController } from './modules/auth/auth.controller.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createTaskController } from './modules/tasks/task.controller.js';
import { createTaskRepository } from './modules/tasks/task.repository.js';
import { createTaskRouter } from './modules/tasks/task.routes.js';
import { createTaskService } from './modules/tasks/task.service.js';
import { createUserRepository } from './modules/users/user.repository.js';

export interface AppDependencies {
  prisma: PrismaClient;
  /** Dossier du build du frontend ; non servi s'il n'existe pas. */
  webDistDir?: string;
}

const defaultWebDistDir = fileURLToPath(new URL('../../web/dist', import.meta.url));

export function createApp({
  prisma,
  webDistDir = env.WEB_DIST_DIR ?? defaultWebDistDir,
}: AppDependencies): Express {
  const app = express();

  // Derrière le proxy de Railway : nécessaire pour la bonne IP client (rate limit) et le HTTPS.
  app.set('trust proxy', env.TRUST_PROXY ?? (isProduction ? 1 : false));

  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Logs concis : ni en-têtes ni cookies.
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());

  // Composition des dépendances (injection manuelle, facilement remplaçable dans les tests).
  const userRepository = createUserRepository(prisma);
  const authController = createAuthController(createAuthService(userRepository));
  const taskController = createTaskController(createTaskService(createTaskRepository(prisma)));

  const api = express.Router();
  api.use('/health', createHealthRouter(prisma));
  api.use(createApiLimiter(env.API_RATE_LIMIT_MAX));
  api.use(originCheck);
  api.use('/v1/auth', createAuthRouter(authController, createAuthLimiter(env.AUTH_RATE_LIMIT_MAX)));
  api.use('/v1/tasks', createTaskRouter(taskController));
  api.use(notFoundHandler);

  app.use('/api', api);

  // En production, Express sert aussi la SPA React (un seul service, même origine).
  if (existsSync(path.join(webDistDir, 'index.html'))) {
    app.use(
      '/assets',
      express.static(path.join(webDistDir, 'assets'), { immutable: true, maxAge: '1y' }),
    );
    app.use(express.static(webDistDir, { index: false }));
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(webDistDir, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
