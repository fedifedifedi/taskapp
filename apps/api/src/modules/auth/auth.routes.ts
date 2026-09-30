import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(controller: AuthController, authLimiter: RequestHandler): Router {
  const router = Router();

  router.post('/register', authLimiter, controller.register);
  router.post('/login', authLimiter, controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', requireAuth, controller.me);

  return router;
}
