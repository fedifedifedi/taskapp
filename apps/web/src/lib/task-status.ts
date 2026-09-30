import { TASK_STATUSES, type TaskStatus } from '@taskapp/shared';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
};

export const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700 ring-slate-300',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 ring-amber-300',
  DONE: 'bg-emerald-50 text-emerald-800 ring-emerald-300',
};

export const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && (TASK_STATUSES as readonly string[]).includes(value);
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
