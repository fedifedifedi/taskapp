import { TASK_STATUSES, type TaskSort, type TaskStatus } from '@taskapp/shared';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
};

export const STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  IN_PROGRESS:
    'bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  DONE: 'bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
};

/** Liseré de couleur à gauche de chaque carte de tâche. */
export const STATUS_ACCENT_CLASSES: Record<TaskStatus, string> = {
  TODO: 'before:bg-slate-300 dark:before:bg-slate-600',
  IN_PROGRESS: 'before:bg-amber-400',
  DONE: 'before:bg-emerald-500',
};

export const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export const SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: '-createdAt', label: 'Plus récentes' },
  { value: 'createdAt', label: 'Plus anciennes' },
  { value: 'dueDate', label: 'Échéance la plus proche' },
  { value: 'title', label: 'Titre (A → Z)' },
];

export const DEFAULT_SORT: TaskSort = '-createdAt';

export function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isSortOption(value: string | null): value is TaskSort {
  return SORT_OPTIONS.some((option) => option.value === value);
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** Date du jour (fuseau local) au format AAAA-MM-JJ. */
export function localToday(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export type DueState = 'overdue' | 'today' | 'upcoming' | 'none';

/** État de l'échéance : une tâche terminée n'est jamais « en retard ». */
export function dueState(
  dueDate: string | null,
  status: TaskStatus,
  today = localToday(),
): DueState {
  if (!dueDate || status === 'DONE') return dueDate ? 'upcoming' : 'none';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(!sameYear && { year: 'numeric' }),
  }).format(date);
}
