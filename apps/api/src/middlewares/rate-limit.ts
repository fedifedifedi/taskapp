import type { ApiErrorBody } from '@taskapp/shared';
import { rateLimit } from 'express-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

function createLimiter(limit: number, message: string) {
  const body: ApiErrorBody = { error: { code: 'RATE_LIMITED', message } };
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(body);
    },
  });
}

/** Limite générale de l'API. */
export function createApiLimiter(limit: number) {
  return createLimiter(limit, 'Trop de requêtes, réessayez plus tard');
}

/** Limite stricte sur l'authentification (protection contre la force brute). */
export function createAuthLimiter(limit: number) {
  return createLimiter(limit, "Trop de tentatives d'authentification, réessayez dans 15 minutes");
}
