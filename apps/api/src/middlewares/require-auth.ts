import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../lib/auth-cookie.js';
import { UnauthorizedError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/jwt.js';
import type { AuthUser } from '../types/express.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || token === '') {
    throw new UnauthorizedError();
  }
  req.user = { id: verifyAccessToken(token).sub };
  next();
}

/** Récupère l'utilisateur authentifié (à utiliser derrière requireAuth). */
export function getAuthUser(req: Request): AuthUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
