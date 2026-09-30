import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createAuthenticatedAgent, createTask, useCleanDatabase } from './helpers.js';

useCleanDatabase();

const TASKS = '/api/v1/tasks';
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Accès aux tâches', () => {
  it.each([
    ['get', TASKS],
    ['post', TASKS],
    ['get', `${TASKS}/${UNKNOWN_ID}`],
    ['patch', `${TASKS}/${UNKNOWN_ID}`],
    ['patch', `${TASKS}/${UNKNOWN_ID}/complete`],
    ['delete', `${TASKS}/${UNKNOWN_ID}`],
  ] as const)('%s %s exige une session (401)', async (method, url) => {
    await request(app)[method](url).expect(401);
  });
});

describe('POST /tasks', () => {
  it('crée une tâche TODO par défaut avec sa date de création', async () => {
    const { agent } = await createAuthenticatedAgent();
    const res = await agent
      .post(TASKS)
      .send({ title: '  Écrire les tests ', description: 'Vitest + Supertest' })
      .expect(201);

    expect(res.body.data).toMatchObject({
      title: 'Écrire les tests',
      description: 'Vitest + Supertest',
      status: 'TODO',
      completedAt: null,
    });
    expect(res.body.data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Date(res.body.data.createdAt).getTime()).not.toBeNaN();
    expect(res.body.data).not.toHaveProperty('userId');
  });

  it('renseigne completedAt pour une tâche créée terminée', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent, { title: 'Déjà faite', status: 'DONE' });
    expect(task.completedAt).not.toBeNull();
  });

  it.each([
    ['titre manquant', {}],
    ['titre vide', { title: '   ' }],
    ['titre trop long', { title: 'x'.repeat(201) }],
    ['statut invalide', { title: 'ok', status: 'ARCHIVED' }],
    ['userId imposé par le client', { title: 'ok', userId: UNKNOWN_ID }],
  ])('renvoie 400 : %s', async (_label, body) => {
    const { agent } = await createAuthenticatedAgent();
    const res = await agent.post(TASKS).send(body).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /tasks', () => {
  it('liste les tâches avec filtre par statut, pagination et tri', async () => {
    const { agent } = await createAuthenticatedAgent();
    await createTask(agent, { title: 'C', status: 'TODO' });
    await createTask(agent, { title: 'A', status: 'IN_PROGRESS' });
    await createTask(agent, { title: 'B', status: 'DONE' });

    const all = await agent.get(TASKS).expect(200);
    expect(all.body.meta).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
    // Tri par défaut : plus récentes d'abord.
    const createdAt = all.body.data.map((task: { createdAt: string }) =>
      Date.parse(task.createdAt),
    );
    expect(createdAt).toEqual([...createdAt].sort((a, b) => b - a));

    const done = await agent.get(TASKS).query({ status: 'DONE' }).expect(200);
    expect(done.body.data).toHaveLength(1);
    expect(done.body.data[0].title).toBe('B');

    const page2 = await agent.get(TASKS).query({ sort: 'title', limit: 2, page: 2 }).expect(200);
    expect(page2.body.data.map((task: { title: string }) => task.title)).toEqual(['C']);
    expect(page2.body.meta).toMatchObject({ page: 2, total: 3, totalPages: 2 });
  });

  it('renvoie 400 pour des paramètres invalides', async () => {
    const { agent } = await createAuthenticatedAgent();
    await agent.get(TASKS).query({ status: 'NOPE' }).expect(400);
    await agent.get(TASKS).query({ limit: 1000 }).expect(400);
  });
});

describe('GET /tasks/:id', () => {
  it("renvoie la tâche, 404 si elle est inconnue, 400 si l'id est invalide", async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent);

    const res = await agent.get(`${TASKS}/${task.id}`).expect(200);
    expect(res.body.data.id).toBe(task.id);

    const missing = await agent.get(`${TASKS}/${UNKNOWN_ID}`).expect(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
    await agent.get(`${TASKS}/pas-un-uuid`).expect(400);
  });
});

describe('PATCH /tasks/:id', () => {
  it('modifie partiellement le titre et vide la description', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent, { title: 'Avant', description: 'Texte' });

    const res = await agent
      .patch(`${TASKS}/${task.id}`)
      .send({ title: 'Après', description: '' })
      .expect(200);
    expect(res.body.data).toMatchObject({ title: 'Après', description: null, status: 'TODO' });
  });

  it('gère le cycle des statuts et completedAt', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent);
    const url = `${TASKS}/${task.id}`;

    const inProgress = await agent.patch(url).send({ status: 'IN_PROGRESS' }).expect(200);
    expect(inProgress.body.data).toMatchObject({ status: 'IN_PROGRESS', completedAt: null });

    const done = await agent.patch(url).send({ status: 'DONE' }).expect(200);
    expect(done.body.data.status).toBe('DONE');
    expect(done.body.data.completedAt).not.toBeNull();

    const reopened = await agent.patch(url).send({ status: 'TODO' }).expect(200);
    expect(reopened.body.data).toMatchObject({ status: 'TODO', completedAt: null });
  });

  it('renvoie 400 pour un corps vide ou un JSON mal formé', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent);

    await agent.patch(`${TASKS}/${task.id}`).send({}).expect(400);
    const res = await agent
      .patch(`${TASKS}/${task.id}`)
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PATCH /tasks/:id/complete', () => {
  it('marque la tâche terminée et conserve la date si on recommence', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent);

    const first = await agent.patch(`${TASKS}/${task.id}/complete`).expect(200);
    expect(first.body.data.status).toBe('DONE');

    const second = await agent.patch(`${TASKS}/${task.id}/complete`).expect(200);
    expect(second.body.data.completedAt).toBe(first.body.data.completedAt);
  });
});

describe('DELETE /tasks/:id', () => {
  it('supprime la tâche (204) puis renvoie 404', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent);

    await agent.delete(`${TASKS}/${task.id}`).expect(204);
    await agent.get(`${TASKS}/${task.id}`).expect(404);
    await agent.delete(`${TASKS}/${task.id}`).expect(404);
  });
});
