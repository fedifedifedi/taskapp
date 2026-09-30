import type { TaskDto, TaskStatus } from '@taskapp/shared';
import { useState } from 'react';
import { ErrorAlert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { ApiError } from '../../api/client';
import { formatDate, STATUS_BADGE_CLASSES, STATUS_LABELS } from '../../lib/task-status';
import { useCompleteTask, useDeleteTask, useUpdateTask } from './hooks';
import { TaskForm } from './TaskForm';

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Une erreur inattendue est survenue';
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
      <li className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-indigo-200">
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
      className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
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
          className="mt-1 size-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id={`task-title-${task.id}`}
              className={`font-medium break-words ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}
            >
              {task.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASSES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          {task.description && (
            <p className="text-sm whitespace-pre-line break-words text-slate-600">
              {task.description}
            </p>
          )}
          <p className="text-xs text-slate-400">
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
            <>
              <Button
                variant="danger"
                loading={deleteTask.isPending}
                onClick={() => deleteTask.mutate(task.id)}
              >
                Confirmer
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label={`Modifier « ${task.title} »`}
              >
                Modifier
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirmingDelete(true)}
                aria-label={`Supprimer « ${task.title} »`}
                className="hover:text-red-600"
              >
                Supprimer
              </Button>
            </>
          )}
        </div>
      </article>
    </li>
  );
}
