import type { TaskDto, TaskStatus } from '@taskapp/shared';
import { useState } from 'react';
import { ApiError } from '../../api/client';
import { ErrorAlert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { AlertIcon, CalendarIcon, PencilIcon, TrashIcon } from '../../components/icons';
import {
  dueState,
  formatDate,
  formatDueDate,
  STATUS_ACCENT_CLASSES,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  type DueState,
} from '../../lib/task-status';
import { useCompleteTask, useDeleteTask, useUpdateTask } from './hooks';
import { TaskForm } from './TaskForm';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Une erreur inattendue est survenue';
}

const DUE_CLASSES: Record<Exclude<DueState, 'none'>, string> = {
  overdue:
    'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30',
  today:
    'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  upcoming:
    'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700',
};

function DueBadge({ dueDate, status }: { dueDate: string; status: TaskStatus }) {
  const state = dueState(dueDate, status);
  if (state === 'none') return null;
  const label =
    state === 'overdue'
      ? `En retard · ${formatDueDate(dueDate)}`
      : state === 'today'
        ? "Échéance aujourd'hui"
        : `Échéance ${formatDueDate(dueDate)}`;
  const Icon = state === 'overdue' ? AlertIcon : CalendarIcon;
  return (
    <span
      data-testid="due-badge"
      data-state={state}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${DUE_CLASSES[state]}`}
    >
      <Icon className="size-3.5" />
      <time dateTime={dueDate}>{label}</time>
    </span>
  );
}

export function TaskItem({ task }: { task: TaskDto }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  // Affichage optimiste : le statut demandé est montré dès le clic, jusqu'au rechargement
  // de la liste ; en cas d'erreur, le statut renvoyé par le serveur réapparaît.
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus | null>(null);
  const status = optimisticStatus ?? task.status;
  const isDone = status === 'DONE';
  const mutationError = updateTask.error ?? completeTask.error ?? deleteTask.error;
  const toggling = optimisticStatus !== null;

  function toggleDone() {
    const onSettled = () => setOptimisticStatus(null);
    if (isDone) {
      setOptimisticStatus('TODO');
      updateTask.mutate({ id: task.id, input: { status: 'TODO' } }, { onSettled });
    } else {
      setOptimisticStatus('DONE');
      completeTask.mutate(task.id, { onSettled });
    }
  }

  if (editing) {
    return (
      <li className="animate-fade-in rounded-2xl bg-white p-5 shadow-md ring-2 ring-indigo-400 dark:bg-slate-900 dark:ring-indigo-500/60">
        <TaskForm
          task={task}
          submitLabel="Enregistrer"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await updateTask.mutateAsync({ id: task.id, input });
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li
      data-testid="task-item"
      className={`group animate-fade-in relative overflow-hidden rounded-2xl bg-white p-4 pl-5 shadow-sm ring-1 ring-slate-200 transition before:absolute before:inset-y-0 before:left-0 before:w-1 hover:shadow-md hover:ring-slate-300 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-slate-700 ${STATUS_ACCENT_CLASSES[status]}`}
    >
      <article aria-labelledby={`task-title-${task.id}`} className="flex gap-3">
        <input
          type="checkbox"
          checked={isDone}
          disabled={toggling}
          onChange={toggleDone}
          aria-label={
            isDone ? `Rouvrir « ${task.title} »` : `Marquer « ${task.title} » comme terminée`
          }
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md accent-emerald-600"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id={`task-title-${task.id}`}
              className={`font-semibold break-words transition ${
                isDone
                  ? 'text-slate-400 line-through dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASSES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
            {task.dueDate && <DueBadge dueDate={task.dueDate} status={status} />}
          </div>
          {task.description && (
            <p className="text-sm whitespace-pre-line break-words text-slate-600 dark:text-slate-400">
              {task.description}
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Créée le <time dateTime={task.createdAt}>{formatDate(task.createdAt)}</time>
            {task.completedAt && (
              <>
                {' · '}terminée le{' '}
                <time dateTime={task.completedAt}>{formatDate(task.completedAt)}</time>
              </>
            )}
          </p>
          {mutationError && <ErrorAlert>{errorMessage(mutationError)}</ErrorAlert>}
        </div>
        <div className="flex shrink-0 items-start gap-1">
          {confirmingDelete ? (
            <div className="flex flex-col gap-1 sm:flex-row">
              <Button
                variant="danger"
                size="sm"
                loading={deleteTask.isPending}
                onClick={() => deleteTask.mutate(task.id)}
              >
                Confirmer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </div>
          ) : (
            <div className="flex gap-0.5 opacity-100 transition sm:opacity-60 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                title="Modifier"
                onClick={() => setEditing(true)}
                aria-label={`Modifier « ${task.title} »`}
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Supprimer"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Supprimer « ${task.title} »`}
                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <TrashIcon />
              </Button>
            </div>
          )}
        </div>
      </article>
    </li>
  );
}
