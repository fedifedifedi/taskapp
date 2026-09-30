import type { TaskStatus } from '@taskapp/shared';
import { STATUS_OPTIONS } from '../../lib/task-status';

const FILTERS: { value: TaskStatus | undefined; label: string }[] = [
  { value: undefined, label: 'Toutes' },
  ...STATUS_OPTIONS,
];

interface StatusFilterProps {
  value: TaskStatus | undefined;
  onChange: (status: TaskStatus | undefined) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <nav
      aria-label="Filtrer par statut"
      className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      {FILTERS.map((filter) => {
        const active = filter.value === value;
        return (
          <button
            key={filter.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-indigo-500 ${
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </nav>
  );
}
