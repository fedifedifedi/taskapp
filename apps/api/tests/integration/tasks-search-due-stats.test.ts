import { describe, expect, it } from 'vitest';
import { createAuthenticatedAgent, createTask, useCleanDatabase } from './helpers.js';

useCleanDatabase();

const TASKS = '/api/v1/tasks';

describe("Date d'échéance", () => {
  it('est enregistrée, modifiée puis supprimée', async () => {
    const { agent } = await createAuthenticatedAgent();
    const task = await createTask(agent, { title: 'Rendre le projet', dueDate: '2026-10-15' });
    expect(task).toMatchObject({ dueDate: '2026-10-15' });

    const updated = await agent
      .patch(`${TASKS}/${task.id}`)
      .send({ dueDate: '2026-11-01' })
      .expect(200);
    expect(updated.body.data.dueDate).toBe('2026-11-01');

    const cleared = await agent.patch(`${TASKS}/${task.id}`).send({ dueDate: '' }).expect(200);
    expect(cleared.body.data.dueDate).toBeNull();
  });

  it('est absente par défaut', async () => {
    const { agent } = await createAuthenticatedAgent();
    expect((await createTask(agent)).dueDate).toBeNull();
  });

  it.each(['15/10/2026', '2026-13-01', '2026-02-30', 'demain'])(
    'rejette une date invalide : %s',
    async (dueDate) => {
      const { agent } = await createAuthenticatedAgent();
      const res = await agent.post(TASKS).send({ title: 'ok', dueDate }).expect(400);
      expect(res.body.error.details[0].path).toBe('dueDate');
    },
  );

  it('trie par échéance, les tâches sans échéance en dernier', async () => {
    const { agent } = await createAuthenticatedAgent();
    await createTask(agent, { title: 'Sans date' });
    await createTask(agent, { title: 'Plus tard', dueDate: '2026-12-01' });
    await createTask(agent, { title: 'Bientôt', dueDate: '2026-10-01' });

    const asc = await agent.get(TASKS).query({ sort: 'dueDate' }).expect(200);
    expect(asc.body.data.map((t: { title: string }) => t.title)).toEqual([
      'Bientôt',
      'Plus tard',
      'Sans date',
    ]);
  });
});

describe('Recherche', () => {
  it('cherche dans le titre et la description, sans tenir compte de la casse', async () => {
    const { agent } = await createAuthenticatedAgent();
    await createTask(agent, { title: 'Configurer la CI' });
    await createTask(agent, { title: 'README', description: 'Documenter la ci et Docker' });
    await createTask(agent, { title: 'Autre chose' });

    const res = await agent.get(TASKS).query({ q: 'CI' }).expect(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.map((t: { title: string }) => t.title).sort()).toEqual([
      'Configurer la CI',
      'README',
    ]);
  });

  it('se combine avec le filtre de statut', async () => {
    const { agent } = await createAuthenticatedAgent();
    await createTask(agent, { title: 'Tests unitaires', status: 'DONE' });
    await createTask(agent, { title: 'Tests E2E', status: 'TODO' });

    const res = await agent.get(TASKS).query({ q: 'tests', status: 'DONE' }).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Tests unitaires');
  });

  it("ignore une recherche vide et ne renvoie que les tâches de l'utilisateur", async () => {
    const alice = await createAuthenticatedAgent('Alice');
    const bob = await createAuthenticatedAgent('Bob');
    await createTask(alice.agent, { title: 'Secret' });
    await createTask(bob.agent, { title: 'Publique' });

    const empty = await bob.agent.get(TASKS).query({ q: '   ' }).expect(200);
    expect(empty.body.meta.total).toBe(1);
    const res = await bob.agent.get(TASKS).query({ q: 'secret' }).expect(200);
    expect(res.body.meta.total).toBe(0);
  });

  it('rejette une recherche trop longue', async () => {
    const { agent } = await createAuthenticatedAgent();
    await agent
      .get(TASKS)
      .query({ q: 'x'.repeat(101) })
      .expect(400);
  });
});

describe('GET /tasks/stats', () => {
  it("compte les tâches par statut, uniquement pour l'utilisateur connecté", async () => {
    const alice = await createAuthenticatedAgent('Alice');
    const bob = await createAuthenticatedAgent('Bob');
    await createTask(alice.agent, { title: 'A', status: 'TODO' });
    await createTask(alice.agent, { title: 'B', status: 'DONE' });
    await createTask(alice.agent, { title: 'C', status: 'DONE' });
    await createTask(bob.agent, { title: 'D', status: 'IN_PROGRESS' });

    const res = await alice.agent.get(`${TASKS}/stats`).expect(200);
    expect(res.body.data).toEqual({ total: 3, byStatus: { TODO: 1, IN_PROGRESS: 0, DONE: 2 } });
  });

  it('renvoie des compteurs à zéro sans tâche, et exige une session', async () => {
    const { agent } = await createAuthenticatedAgent();
    const res = await agent.get(`${TASKS}/stats`).expect(200);
    expect(res.body.data).toEqual({ total: 0, byStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 } });
  });
});
