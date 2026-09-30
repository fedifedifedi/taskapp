import type {
  CreateTaskInput,
  ListTasksQuery,
  PaginatedResponse,
  TaskDto,
  TaskStatus,
  UpdateTaskInput,
} from '@taskapp/shared';
import { NotFoundError } from '../../lib/errors.js';
import { toTaskDto } from './task.mapper.js';
import type { TaskRepository, UpdateTaskData } from './task.repository.js';

const TASK_NOT_FOUND = 'Tâche introuvable';

/**
 * Règle métier : completedAt est renseigné au passage à DONE, conservé tant que la tâche
 * reste DONE, et remis à null si elle est rouverte.
 */
export function resolveCompletedAt(
  nextStatus: TaskStatus,
  previous: { status: TaskStatus; completedAt: Date | null } | null,
  now: Date = new Date(),
): Date | null {
  if (nextStatus !== 'DONE') return null;
  if (previous?.status === 'DONE' && previous.completedAt) return previous.completedAt;
  return now;
}

export function createTaskService(tasks: TaskRepository) {
  async function getOwnedTask(userId: string, taskId: string) {
    const task = await tasks.findByIdForUser(taskId, userId);
    // 404 plutôt que 403 : on ne révèle pas l'existence des tâches des autres utilisateurs.
    if (!task) throw new NotFoundError(TASK_NOT_FOUND);
    return task;
  }

  return {
    async list(userId: string, query: ListTasksQuery): Promise<PaginatedResponse<TaskDto>> {
      const { tasks: items, total } = await tasks.findMany({
        userId,
        status: query.status,
        sort: query.sort,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
      return {
        data: items.map(toTaskDto),
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    },

    async getById(userId: string, taskId: string): Promise<TaskDto> {
      return toTaskDto(await getOwnedTask(userId, taskId));
    },

    async create(userId: string, input: CreateTaskInput): Promise<TaskDto> {
      const status = input.status ?? 'TODO';
      const task = await tasks.create({
        userId,
        title: input.title,
        description: input.description ?? null,
        status,
        completedAt: resolveCompletedAt(status, null),
      });
      return toTaskDto(task);
    },

    async update(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskDto> {
      const existing = await getOwnedTask(userId, taskId);
      const data: UpdateTaskData = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.status !== undefined) {
        data.status = input.status;
        data.completedAt = resolveCompletedAt(input.status, existing);
      }
      return toTaskDto(await tasks.update(existing.id, data));
    },

    async complete(userId: string, taskId: string): Promise<TaskDto> {
      const existing = await getOwnedTask(userId, taskId);
      if (existing.status === 'DONE') return toTaskDto(existing);
      const task = await tasks.update(existing.id, {
        status: 'DONE',
        completedAt: resolveCompletedAt('DONE', existing),
      });
      return toTaskDto(task);
    },

    async remove(userId: string, taskId: string): Promise<void> {
      const deleted = await tasks.deleteForUser(taskId, userId);
      if (!deleted) throw new NotFoundError(TASK_NOT_FOUND);
    },
  };
}

export type TaskService = ReturnType<typeof createTaskService>;
