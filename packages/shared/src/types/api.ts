import type { TaskStatus } from '../schemas/task.js';

/** Représentation publique d'un utilisateur (jamais de hash de mot de passe). */
export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Date d'échéance (AAAA-MM-JJ), sans heure. */
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Nombre de tâches de l'utilisateur, au total et par statut (tableau de bord). */
export interface TaskStatsDto {
  total: number;
  byStatus: Record<TaskStatus, number>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ValidationIssue {
  path: string;
  message: string;
}

/** Format unique de toutes les erreurs renvoyées par l'API. */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: ValidationIssue[];
  };
}
