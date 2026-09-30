import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { durationToSeconds } from '../../src/lib/duration.js';
import { UnauthorizedError } from '../../src/lib/errors.js';
import { signAccessToken, verifyAccessToken } from '../../src/lib/jwt.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SECRET = process.env.JWT_SECRET!;

describe('JWT', () => {
  it('signe puis vérifie un jeton', () => {
    expect(verifyAccessToken(signAccessToken(USER_ID))).toEqual({ sub: USER_ID });
  });

  it.each([
    ['falsifié', () => `${signAccessToken(USER_ID)}x`],
    [
      'signé avec un autre secret',
      () => jwt.sign({ sub: USER_ID, iss: 'taskapp' }, 'another-secret'),
    ],
    ['expiré', () => jwt.sign({ sub: USER_ID, iss: 'taskapp', exp: 1 }, SECRET)],
    [
      'sans signature (alg: none)',
      () => jwt.sign({ sub: USER_ID, iss: 'taskapp' }, '', { algorithm: 'none' }),
    ],
    ["d'un autre émetteur", () => jwt.sign({ sub: USER_ID, iss: 'other' }, SECRET)],
  ])('rejette un jeton %s', (_label, makeToken) => {
    expect(() => verifyAccessToken(makeToken())).toThrow(UnauthorizedError);
  });
});

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['12h', 43_200],
    ['1d', 86_400],
  ])('%s = %i secondes', (input, expected) => {
    expect(durationToSeconds(input)).toBe(expected);
  });

  it('rejette un format invalide', () => {
    expect(() => durationToSeconds('1 week')).toThrow();
  });
});
