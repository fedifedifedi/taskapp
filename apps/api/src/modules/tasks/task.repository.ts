import type { TaskSort, TaskStatus } from '@taskapp/shared';
import type { Prisma, PrismaClient, Task } from '../../generated/prisma/client.js';

export interface FindTasksOptions {
  userId: string;
  status?: TaskStatus;
  search?: string;
  skip: number;
  take: number;
  sort: TaskSort;
}

export interface CreateTaskData {
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  completedAt: Date | null;
  dueDate?: Date | null;
}

export type UpdateTaskData = Partial<Omit<CreateTaskData, 'userId'>>;

function toOrderBy(sort: TaskSort): Prisma.TaskOrderByWithRelationInput[] {
  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const field = sort.replace(/^-/, '') as keyof Prisma.TaskOrderByWithRelationInput;
  // Les tâches sans échéance sont toujours placées après celles qui en ont une.
  const primary =
    field === 'dueDate' ? { dueDate: { sort: direction, nulls: 'last' } } : { [field]: direction };
  // Tri secondaire sur l'id : ordre stable entre les pages.
  return [primary as Prisma.TaskOrderByWithRelationInput, { id: 'asc' }];
}

/**
 * Toutes les requêtes sont filtrées par userId : un utilisateur ne peut jamais lire
 * ni modifier la tâche d'un autre (protection IDOR).
 */
export function createTaskRepository(prisma: PrismaClient) {
  return {
    async findMany(options: FindTasksOptions): Promise<{ tasks: Task[]; total: number }> {
      const where: Prisma.TaskWhereInput = {
        userId: options.userId,
        ...(options.status && { status: options.status }),
        ...(options.search && {
          OR: [
            { title: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
      };
      const [tasks, total] = await prisma.$transaction([
        prisma.task.findMany({
          where,
          orderBy: toOrderBy(options.sort),
          skip: options.skip,
          take: options.take,
        }),
        prisma.task.count({ where }),
      ]);
      return { tasks, total };
    },

    async countByStatus(userId: string): Promise<Partial<Record<TaskStatus, number>>> {
      const groups = await prisma.task.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      });
      return Object.fromEntries(groups.map((group) => [group.status, group._count._all]));
    },

    findByIdForUser(id: string, userId: string): Promise<Task | null> {
      return prisma.task.findFirst({ where: { id, userId } });
    },

    create(data: CreateTaskData): Promise<Task> {
      return prisma.task.create({ data });
    },

    update(id: string, data: UpdateTaskData): Promise<Task> {
      return prisma.task.update({ where: { id }, data });
    },

    async deleteForUser(id: string, userId: string): Promise<boolean> {
      const { count } = await prisma.task.deleteMany({ where: { id, userId } });
      return count > 0;
    },
  };
}

export type TaskRepository = ReturnType<typeof createTaskRepository>;
