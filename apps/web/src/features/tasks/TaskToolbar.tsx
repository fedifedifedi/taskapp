import { TASK_SEARCH_MAX_LENGTH, type TaskSort } from '@taskapp/shared';
import { useEffect, useRef, useState } from 'react';
import { FIELD_CLASSES } from '../../components/FormField';
import { SearchIcon, XIcon } from '../../components/icons';
import { SORT_OPTIONS } from '../../lib/task-status';

const SEARCH_DELAY_MS = 300;

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
}

/** Recherche avec délai (debounce) : une requête après une courte pause de frappe. */
export function SearchInput({ value, onSearch }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const next = draft.trim();
    if (next === value) return;
    const timer = setTimeout(() => onSearchRef.current(next), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor="task-search" className="sr-only">
        Rechercher une tâche
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        id="task-search"
        type="search"
        value={draft}
        maxLength={TASK_SEARCH_MAX_LENGTH}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Rechercher une tâche…"
        className={`${FIELD_CLASSES} ring-slate-300 dark:ring-slate-700 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden`}
      />
      {draft && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          onClick={() => {
            setDraft('');
            onSearchRef.current('');
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

interface SortSelectProps {
  value: TaskSort;
  onChange: (value: TaskSort) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="shrink-0">
      <label htmlFor="task-sort" className="sr-only">
        Trier par
      </label>
      <select
        id="task-sort"
        value={value}
        onChange={(event) => onChange(event.target.value as TaskSort)}
        className={`${FIELD_CLASSES} ring-slate-300 dark:ring-slate-700 w-auto pr-8`}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
