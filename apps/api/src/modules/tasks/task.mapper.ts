import type { TaskDto } from '@taskapp/shared';
import type { Task } from '../../generated/prisma/client.js';

/** "AAAA-MM-JJ" → Date à minuit UTC (colonne PostgreSQL DATE, sans fuseau horaire). */
export function toDbDate(date: string | null): Date | null {
  return date === null ? null : new Date(`${date}T00:00:00.000Z`);
}

export function toTaskDto(task: Task): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
