import type { TaskStatsDto, TaskStatus } from '@taskapp/shared';
import type { ComponentType, SVGProps } from 'react';
import { CheckCircleIcon, CircleIcon, ClockIcon, ListIcon } from '../../components/icons';

interface Card {
  status: TaskStatus | undefined;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClasses: string;
}

const CARDS: Card[] = [
  {
    status: undefined,
    label: 'Total',
    Icon: ListIcon,
    iconClasses: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  {
    status: 'TODO',
    label: 'À faire',
    Icon: CircleIcon,
    iconClasses: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    status: 'IN_PROGRESS',
    label: 'En cours',
    Icon: ClockIcon,
    iconClasses: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    status: 'DONE',
    label: 'Terminées',
    Icon: CheckCircleIcon,
    iconClasses: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
];

interface TaskStatsProps {
  stats: TaskStatsDto | undefined;
  activeStatus: TaskStatus | undefined;
  onSelect: (status: TaskStatus | undefined) => void;
}

export function TaskStats({ stats, activeStatus, onSelect }: TaskStatsProps) {
  const done = stats?.byStatus.DONE ?? 0;
  const total = stats?.total ?? 0;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section aria-label="Tableau de bord" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CARDS.map(({ status, label, Icon, iconClasses }) => {
          const count = status ? stats?.byStatus[status] : stats?.total;
          const active = activeStatus === status;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(status)}
              aria-pressed={active}
              aria-label={`${label} : ${count ?? '…'} tâche${count === 1 ? '' : 's'}`}
              data-testid={`stat-${status ?? 'TOTAL'}`}
              className={`group flex items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-indigo-500 dark:bg-slate-900 ${
                active
                  ? 'ring-2 ring-indigo-500 dark:ring-indigo-400'
                  : 'ring-slate-200 dark:ring-slate-800'
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconClasses}`}
              >
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-2xl leading-none font-bold tabular-nums">
                  {count ?? '–'}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span id="progress-label" className="font-medium text-slate-700 dark:text-slate-300">
            Progression
          </span>
          <span className="font-semibold text-indigo-600 tabular-nums dark:text-indigo-400">
            {progress} %
          </span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="progress-label"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${done} tâche${done === 1 ? '' : 's'} terminée${done === 1 ? '' : 's'} sur ${total}`}
          className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
