import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../lib/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Défense CSRF en complément du cookie SameSite=Lax : les requêtes qui modifient des
 * données doivent venir de la même origine que l'API. Les clients non navigateurs
 * (curl, tests) n'envoient ni Origin ni Sec-Fetch-Site et ne sont pas concernés.
 */
export function originCheck(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) return next();

  if (req.get('sec-fetch-site') === 'cross-site') {
    throw new ForbiddenError('Requête cross-site refusée');
  }

  const origin = req.get('origin');
  if (origin !== undefined) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new ForbiddenError('En-tête Origin invalide');
    }
    // req.host tient compte de X-Forwarded-Host quand "trust proxy" est activé.
    if (originHost !== req.host) {
      throw new ForbiddenError('Origine non autorisée');
    }
  }

  next();
}
