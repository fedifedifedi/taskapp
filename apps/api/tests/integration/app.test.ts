import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createAuthenticatedAgent, useCleanDatabase } from './helpers.js';

useCleanDatabase();

describe('Santé et erreurs génériques', () => {
  it('GET /api/health vérifie la base de données', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('renvoie une 404 JSON au format standard pour une route API inconnue', async () => {
    const res = await request(app).get('/api/v1/inconnue').expect(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route introuvable : GET /v1/inconnue' },
    });
  });

  it('renvoie 413 pour un corps de requête trop volumineux', async () => {
    const { agent } = await createAuthenticatedAgent();
    await agent
      .post('/api/v1/tasks')
      .send({ title: 'ok', description: 'x'.repeat(20_000) })
      .expect(413);
  });

  it('applique les en-têtes de sécurité (helmet)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe("Protection CSRF (contrôle d'origine)", () => {
  it("refuse une écriture provenant d'une autre origine", async () => {
    const { agent } = await createAuthenticatedAgent();
    const res = await agent
      .post('/api/v1/tasks')
      .set('Origin', 'https://evil.example.com')
      .send({ title: 'csrf' })
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('refuse une requête marquée cross-site par le navigateur', async () => {
    const { agent } = await createAuthenticatedAgent();
    await agent
      .post('/api/v1/tasks')
      .set('Sec-Fetch-Site', 'cross-site')
      .send({ title: 'csrf' })
      .expect(403);
  });

  it('accepte une écriture de même origine', async () => {
    const { agent } = await createAuthenticatedAgent();
    await agent
      .post('/api/v1/tasks')
      .set('Host', 'taskapp.example.com')
      .set('Origin', 'https://taskapp.example.com')
      .send({ title: 'même origine' })
      .expect(201);
  });
});
