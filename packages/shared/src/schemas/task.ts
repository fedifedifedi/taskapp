import { z } from 'zod';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES, { error: 'Statut invalide' });
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

const titleSchema = z
  .string({ error: 'Le titre est requis' })
  .trim()
  .min(1, 'Le titre est requis')
  .max(TASK_TITLE_MAX_LENGTH, `Le titre ne doit pas dépasser ${TASK_TITLE_MAX_LENGTH} caractères`);

const descriptionSchema = z
  .string()
  .trim()
  .max(
    TASK_DESCRIPTION_MAX_LENGTH,
    `La description ne doit pas dépasser ${TASK_DESCRIPTION_MAX_LENGTH} caractères`,
  )
  // Une description vide est stockée comme "absente".
  .transform((value) => (value === '' ? null : value))
  .nullable();

export const createTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.optional(),
    status: taskStatusSchema.optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    status: taskStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Au moins un champ doit être fourni',
  });

export const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'status'] as const;
export const TASK_SORT_VALUES = TASK_SORT_FIELDS.flatMap((field) => [field, `-${field}`] as const);

export const listTasksQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(TASK_SORT_VALUES).default('-createdAt'),
});

export const taskIdParamsSchema = z.object({
  id: z.uuid('Identifiant de tâche invalide'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TaskSort = ListTasksQuery['sort'];
