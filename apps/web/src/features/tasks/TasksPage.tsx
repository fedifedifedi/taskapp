import type { TaskStatus } from '@taskapp/shared';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { isTaskStatus, STATUS_LABELS } from '../../lib/task-status';
import { useCreateTask, useTasks } from './hooks';
import { Pagination } from './Pagination';
import { StatusFilter } from './StatusFilter';
import { TaskForm } from './TaskForm';
import { TaskItem } from './TaskItem';

const PAGE_SIZE = 10;

function toSearchParams({ status, page }: { status?: TaskStatus; page?: number }) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page && page > 1) params.set('page', String(page));
  return params;
}

export function TasksPage() {
  // Filtre et page dans l'URL : partageables et conservés au rechargement.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status');
  const status = isTaskStatus(rawStatus) ? rawStatus : undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const tasksQuery = useTasks({ status, page, limit: PAGE_SIZE });
  const createTask = useCreateTask();
  const totalPages = tasksQuery.data?.meta.totalPages;

  function updateParams(next: { status?: TaskStatus; page?: number }) {
    setSearchParams(toSearchParams(next));
  }

  // Page devenue vide (ex. : suppression du dernier élément) : retour à la dernière page.
  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page > totalPages) {
      setSearchParams(toSearchParams({ status, page: totalPages }), { replace: true });
    }
  }, [page, status, totalPages, setSearchParams]);

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
      <section
        aria-labelledby="new-task-heading"
        className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
        <h2 id="new-task-heading" className="mb-4 text-lg font-semibold">
          Nouvelle tâche
        </h2>
        <TaskForm
          submitLabel="Ajouter la tâche"
          onSubmit={(input) => createTask.mutateAsync(input)}
        />
      </section>

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="tasks-heading" className="text-2xl font-bold">
            Mes tâches
            {tasksQuery.data && (
              <span className="ml-2 text-base font-normal text-slate-500">
                ({tasksQuery.data.meta.total})
              </span>
            )}
          </h1>
          <StatusFilter value={status} onChange={(next) => updateParams({ status: next })} />
        </div>

        {tasksQuery.isPending ? (
          <Spinner label="Chargement des tâches…" />
        ) : tasksQuery.isError ? (
          <ErrorAlert>Impossible de charger les tâches. Réessayez plus tard.</ErrorAlert>
        ) : tasksQuery.data.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
            {status
              ? `Aucune tâche avec le statut « ${STATUS_LABELS[status]} ».`
              : 'Aucune tâche pour le moment. Créez votre première tâche !'}
          </p>
        ) : (
          <>
            <ul aria-label="Liste des tâches" className="space-y-3">
              {tasksQuery.data.data.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
            <Pagination
              meta={tasksQuery.data.meta}
              onPageChange={(next) => updateParams({ status, page: next })}
            />
          </>
        )}
      </section>
    </div>
  );
}
