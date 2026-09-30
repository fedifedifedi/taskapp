import { describe, expect, it } from 'vitest';
import { createAuthenticatedAgent, createTask, prisma, useCleanDatabase } from './helpers.js';

useCleanDatabase();

const TASKS = '/api/v1/tasks';

describe('Isolation des données entre utilisateurs (IDOR)', () => {
  async function setup() {
    const alice = await createAuthenticatedAgent('Alice');
    const bob = await createAuthenticatedAgent('Bob');
    const aliceTask = await createTask(alice.agent, { title: 'Privée', description: 'Secret' });
    return { alice, bob, aliceTask };
  }

  it("un utilisateur ne voit pas les tâches d'un autre dans la liste", async () => {
    const { bob } = await setup();
    const res = await bob.agent.get(TASKS).expect(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it.each([
    ['lire', 'get', ''],
    ['modifier', 'patch', ''],
    ['terminer', 'patch', '/complete'],
    ['supprimer', 'delete', ''],
  ] as const)(
    "ne peut pas %s la tâche d'un autre : 404 et aucune modification",
    async (_action, method, suffix) => {
      const { bob, aliceTask } = await setup();

      const res = await bob.agent[method](`${TASKS}/${aliceTask.id}${suffix}`)
        .send(method === 'patch' && !suffix ? { title: 'Piratée', status: 'DONE' } : undefined)
        .expect(404);
      // 404 et non 403 : l'existence de la tâche n'est pas révélée.
      expect(res.body.error.code).toBe('NOT_FOUND');

      const stored = await prisma.task.findUniqueOrThrow({ where: { id: aliceTask.id } });
      expect(stored).toMatchObject({ title: 'Privée', status: 'TODO', completedAt: null });
    },
  );

  it("la suppression d'un compte supprime ses tâches (cascade)", async () => {
    const { alice, aliceTask } = await setup();
    await prisma.user.delete({ where: { id: alice.user.id } });
    expect(await prisma.task.findUnique({ where: { id: aliceTask.id } })).toBeNull();
  });
});
