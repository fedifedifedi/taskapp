import type { TaskSort, TaskStatus } from '@taskapp/shared';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ErrorAlert } from '../../components/Alert';
import { PlusIcon, SearchIcon } from '../../components/icons';
import { Spinner } from '../../components/Spinner';
import { DEFAULT_SORT, isSortOption, isTaskStatus, STATUS_LABELS } from '../../lib/task-status';
import { useCurrentUser } from '../auth/hooks';
import { useCreateTask, useTasks, useTaskStats } from './hooks';
import { Pagination } from './Pagination';
import { StatusFilter } from './StatusFilter';
import { TaskForm } from './TaskForm';
import { TaskItem } from './TaskItem';
import { TaskStats } from './TaskStats';
import { SearchInput, SortSelect } from './TaskToolbar';

const PAGE_SIZE = 10;

interface ListState {
  status?: TaskStatus;
  q?: string;
  sort?: TaskSort;
  page?: number;
}

function toSearchParams({ status, q, sort, page }: ListState) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (q) params.set('q', q);
  if (sort && sort !== DEFAULT_SORT) params.set('sort', sort);
  if (page && page > 1) params.set('page', String(page));
  return params;
}

function greeting(): string {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';
}

export function TasksPage() {
  // Filtre, recherche, tri et page dans l'URL : partageables et conservés au rechargement.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status');
  const status = isTaskStatus(rawStatus) ? rawStatus : undefined;
  const q = searchParams.get('q')?.trim() ?? '';
  const rawSort = searchParams.get('sort');
  const sort = isSortOption(rawSort) ? rawSort : DEFAULT_SORT;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const { data: user } = useCurrentUser();
  const tasksQuery = useTasks({ status, q: q || undefined, sort, page, limit: PAGE_SIZE });
  const statsQuery = useTaskStats();
  const createTask = useCreateTask();
  const totalPages = tasksQuery.data?.meta.totalPages;

  // Toute modification des critères ramène à la première page.
  function updateParams(next: ListState) {
    setSearchParams(toSearchParams({ status, q, sort, ...next, page: next.page ?? 1 }));
  }

  // Page devenue vide (ex. : suppression du dernier élément) : retour à la dernière page.
  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page > totalPages) {
      setSearchParams(toSearchParams({ status, q, sort, page: totalPages }), { replace: true });
    }
  }, [page, status, q, sort, totalPages, setSearchParams]);

  const firstName = user?.name.split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {greeting()}
          {firstName ? `, ${firstName}` : ''} 👋
        </p>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Voici où en sont vos tâches aujourd&apos;hui.
        </p>
      </div>

      <TaskStats
        stats={statsQuery.data}
        activeStatus={status}
        onSelect={(next) => updateParams({ status: next })}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[22rem_1fr]">
        <section
          aria-labelledby="new-task-heading"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-24 dark:bg-slate-900 dark:ring-slate-800"
        >
          <h2 id="new-task-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <PlusIcon />
            </span>
            Nouvelle tâche
          </h2>
          <TaskForm
            submitLabel="Ajouter la tâche"
            onSubmit={(input) => createTask.mutateAsync(input)}
          />
        </section>

        <section aria-labelledby="tasks-heading" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 id="tasks-heading" className="text-2xl font-bold tracking-tight">
              Mes tâches
              {tasksQuery.data && (
                <span className="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">
                  ({tasksQuery.data.meta.total})
                </span>
              )}
            </h1>
            <StatusFilter value={status} onChange={(next) => updateParams({ status: next })} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput value={q} onSearch={(next) => updateParams({ q: next })} />
            <SortSelect value={sort} onChange={(next) => updateParams({ sort: next })} />
          </div>

          {tasksQuery.isPending ? (
            <Spinner label="Chargement des tâches…" />
          ) : tasksQuery.isError ? (
            <ErrorAlert>Impossible de charger les tâches. Réessayez plus tard.</ErrorAlert>
          ) : tasksQuery.data.data.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <SearchIcon className="mx-auto mb-3 size-8 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                {q
                  ? `Aucune tâche ne correspond à « ${q} ».`
                  : status
                    ? `Aucune tâche avec le statut « ${STATUS_LABELS[status]} ».`
                    : 'Aucune tâche pour le moment. Créez votre première tâche !'}
              </p>
            </div>
          ) : (
            <>
              <ul aria-label="Liste des tâches" className="space-y-3">
                {tasksQuery.data.data.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
              <Pagination
                meta={tasksQuery.data.meta}
                onPageChange={(next) => updateParams({ page: next })}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
