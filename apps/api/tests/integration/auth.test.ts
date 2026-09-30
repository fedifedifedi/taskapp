import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { signAccessToken } from '../../src/lib/jwt.js';
import {
  app,
  createAuthenticatedAgent,
  DEFAULT_PASSWORD,
  prisma,
  useCleanDatabase,
} from './helpers.js';

useCleanDatabase();

const REGISTER = '/api/v1/auth/register';
const LOGIN = '/api/v1/auth/login';
const ME = '/api/v1/auth/me';

function sessionCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = cookies.find((value) => value.startsWith('taskapp_session='));
  if (!cookie) throw new Error('Cookie de session absent');
  return cookie;
}

describe('POST /auth/register', () => {
  it('crée le compte, ouvre la session et ne renvoie jamais le hash', async () => {
    const res = await request(app)
      .post(REGISTER)
      .send({ email: '  Alice@Example.COM ', name: 'Alice', password: DEFAULT_PASSWORD })
      .expect(201);

    expect(res.body.data).toMatchObject({ email: 'alice@example.com', name: 'Alice' });
    expect(res.body.data).not.toHaveProperty('passwordHash');

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'alice@example.com' } });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("renvoie 409 si l'email est déjà utilisé (insensible à la casse)", async () => {
    const { email } = await createAuthenticatedAgent('Alice');
    const res = await request(app)
      .post(REGISTER)
      .send({ email: email.toUpperCase(), name: 'Autre', password: DEFAULT_PASSWORD })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('renvoie 400 avec le détail par champ si les données sont invalides', async () => {
    const res = await request(app)
      .post(REGISTER)
      .send({ email: 'invalide', name: '', password: 'court' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((issue: { path: string }) => issue.path);
    expect(fields).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });

  it('refuse les champs non prévus (mass assignment)', async () => {
    await request(app)
      .post(REGISTER)
      .send({ email: 'bob@example.com', name: 'Bob', password: DEFAULT_PASSWORD, isAdmin: true })
      .expect(400);
  });
});

describe('POST /auth/login', () => {
  it('ouvre une session avec des identifiants valides', async () => {
    const { email } = await createAuthenticatedAgent('Alice');
    const res = await request(app)
      .post(LOGIN)
      .send({ email, password: DEFAULT_PASSWORD })
      .expect(200);

    expect(res.body.data.email).toBe(email);
    const me = await request(app).get(ME).set('Cookie', sessionCookie(res)).expect(200);
    expect(me.body.data.email).toBe(email);
  });

  it('renvoie la même erreur 401 pour un mauvais mot de passe et un email inconnu', async () => {
    const { email } = await createAuthenticatedAgent('Alice');
    const wrongPassword = await request(app)
      .post(LOGIN)
      .send({ email, password: 'WrongPass1' })
      .expect(401);
    const unknownEmail = await request(app)
      .post(LOGIN)
      .send({ email: 'inconnu@example.com', password: 'WrongPass1' })
      .expect(401);

    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();
  });
});

describe('GET /auth/me et session', () => {
  it('renvoie 401 sans cookie', async () => {
    const res = await request(app).get(ME).expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('renvoie 401 avec un jeton falsifié', async () => {
    await request(app).get(ME).set('Cookie', 'taskapp_session=not.a.valid.token').expect(401);
  });

  it("renvoie 401 et efface le cookie si l'utilisateur n'existe plus", async () => {
    const token = signAccessToken('00000000-0000-4000-8000-000000000000');
    const res = await request(app).get(ME).set('Cookie', `taskapp_session=${token}`).expect(401);
    expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('POST /auth/logout ferme la session', async () => {
    const { agent } = await createAuthenticatedAgent('Alice');
    const res = await agent.post('/api/v1/auth/logout').expect(204);
    expect(sessionCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);
    await agent.get(ME).expect(401);
  });
});
