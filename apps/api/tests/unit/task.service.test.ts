import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../../src/generated/prisma/client.js';
import { NotFoundError } from '../../src/lib/errors.js';
import type { TaskRepository } from '../../src/modules/tasks/task.repository.js';
import { createTaskService, resolveCompletedAt } from '../../src/modules/tasks/task.service.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TASK_ID = '22222222-2222-4222-8222-222222222222';

function makeTask(overrides: Partial<Task> = {}): Task {
  const date = new Date('2026-01-01T10:00:00.000Z');
  return {
    id: TASK_ID,
    userId: USER_ID,
    title: 'Tâche',
    description: null,
    status: 'TODO',
    completedAt: null,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

function makeRepository(existing: Task | null = makeTask()) {
  return {
    findMany: vi.fn(),
    findByIdForUser: vi.fn().mockResolvedValue(existing),
    create: vi.fn(async (data) => makeTask(data)),
    update: vi.fn(async (_id, data) => makeTask({ ...existing, ...data })),
    deleteForUser: vi.fn().mockResolvedValue(existing !== null),
  } satisfies TaskRepository;
}

describe('resolveCompletedAt', () => {
  const now = new Date('2026-02-01T00:00:00.000Z');
  const earlier = new Date('2026-01-15T00:00:00.000Z');

  it('renseigne la date au passage à DONE', () => {
    expect(resolveCompletedAt('DONE', { status: 'TODO', completedAt: null }, now)).toBe(now);
  });

  it('conserve la date si la tâche était déjà DONE', () => {
    expect(resolveCompletedAt('DONE', { status: 'DONE', completedAt: earlier }, now)).toBe(earlier);
  });

  it('remet la date à null si la tâche est rouverte', () => {
    expect(resolveCompletedAt('TODO', { status: 'DONE', completedAt: earlier }, now)).toBeNull();
    expect(
      resolveCompletedAt('IN_PROGRESS', { status: 'DONE', completedAt: earlier }, now),
    ).toBeNull();
  });

  it('renseigne la date pour une tâche créée directement en DONE', () => {
    expect(resolveCompletedAt('DONE', null, now)).toBe(now);
  });
});

describe('TaskService', () => {
  it('crée une tâche TODO par défaut, sans date de fin', async () => {
    const repository = makeRepository();
    const task = await createTaskService(repository).create(USER_ID, { title: 'Nouvelle' });

    expect(repository.create).toHaveBeenCalledWith({
      userId: USER_ID,
      title: 'Nouvelle',
      description: null,
      status: 'TODO',
      completedAt: null,
    });
    expect(task.status).toBe('TODO');
  });

  it('calcule la pagination', async () => {
    const repository = makeRepository();
    repository.findMany.mockResolvedValue({ tasks: [makeTask()], total: 21 });

    const result = await createTaskService(repository).list(USER_ID, {
      page: 3,
      limit: 10,
      sort: '-createdAt',
    });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, skip: 20, take: 10 }),
    );
    expect(result.meta).toEqual({ page: 3, limit: 10, total: 21, totalPages: 3 });
  });

  it('ne modifie que les champs fournis', async () => {
    const repository = makeRepository();
    await createTaskService(repository).update(USER_ID, TASK_ID, { title: 'Renommée' });

    expect(repository.update).toHaveBeenCalledWith(TASK_ID, { title: 'Renommée' });
  });

  it('renseigne completedAt quand le statut passe à DONE', async () => {
    const repository = makeRepository();
    await createTaskService(repository).update(USER_ID, TASK_ID, { status: 'DONE' });

    expect(repository.update).toHaveBeenCalledWith(TASK_ID, {
      status: 'DONE',
      completedAt: expect.any(Date),
    });
  });

  it('complete() est idempotent : aucune écriture si la tâche est déjà terminée', async () => {
    const repository = makeRepository(makeTask({ status: 'DONE', completedAt: new Date() }));
    const task = await createTaskService(repository).complete(USER_ID, TASK_ID);

    expect(task.status).toBe('DONE');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each(['getById', 'update', 'complete', 'remove'] as const)(
    '%s lève NotFoundError pour une tâche absente ou appartenant à un autre utilisateur',
    async (method) => {
      const service = createTaskService(makeRepository(null));
      const call =
        method === 'update'
          ? service.update(USER_ID, TASK_ID, { title: 'x' })
          : service[method](USER_ID, TASK_ID);

      await expect(call).rejects.toBeInstanceOf(NotFoundError);
    },
  );
});
