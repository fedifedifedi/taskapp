import type { CookieOptions, Response } from 'express';
import { isProduction } from '../config/env.js';
import { tokenTtlSeconds } from './jwt.js';

export const AUTH_COOKIE_NAME = 'taskapp_session';

const baseCookieOptions: CookieOptions = {
  httpOnly: true, // inaccessible au JavaScript : protège le jeton contre le vol par XSS
  secure: isProduction, // HTTPS uniquement en production
  sameSite: 'lax', // non envoyé sur les requêtes cross-site non sûres (CSRF)
  path: '/',
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions, maxAge: tokenTtlSeconds * 1000 });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions);
}
