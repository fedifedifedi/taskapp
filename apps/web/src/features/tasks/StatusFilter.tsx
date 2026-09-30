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
      className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
    >
      {FILTERS.map((filter) => {
        const active = filter.value === value;
        return (
          <button
            key={filter.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </nav>
  );
}
