import type { ComponentType, SVGProps } from 'react';
import { useTheme, type ThemePreference } from '../lib/theme';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { value: 'light', label: 'Thème clair', Icon: SunIcon },
  { value: 'dark', label: 'Thème sombre', Icon: MoonIcon },
  { value: 'system', label: 'Thème du système', Icon: MonitorIcon },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Choix du thème"
      className="flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setPreference(value)}
            className={`rounded-full p-1.5 transition focus-visible:outline-2 focus-visible:outline-indigo-500 ${
              active
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-600 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
