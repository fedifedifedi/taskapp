import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { durationToSeconds } from './duration.js';
import { UnauthorizedError } from './errors.js';

const ALGORITHM = 'HS256';
const ISSUER = 'taskapp';

export const tokenTtlSeconds = durationToSeconds(env.JWT_EXPIRES_IN);

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    issuer: ISSUER,
    expiresIn: tokenTtlSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    // L'algorithme est imposé pour empêcher les attaques de type "alg: none".
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Payload invalide');
    }
    return { sub: payload.sub };
  } catch {
    throw new UnauthorizedError('Session invalide ou expirée');
  }
}
