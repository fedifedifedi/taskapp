import type { ReactNode } from 'react';
import { CalendarIcon, CheckCircleIcon, LogoIcon, SearchIcon } from '../../components/icons';
import { ThemeToggle } from '../../components/ThemeToggle';

const FEATURES = [
  { Icon: CheckCircleIcon, text: 'Suivez vos tâches de « À faire » à « Terminée »' },
  { Icon: CalendarIcon, text: "Fixez des échéances et repérez les retards d'un coup d'œil" },
  { Icon: SearchIcon, text: 'Retrouvez tout instantanément grâce à la recherche' },
];

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de présentation (grands écrans) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-400/20 blur-3xl"
        />
        <div className="relative flex items-center gap-2 text-xl font-bold">
          <LogoIcon className="size-8" />
          TaskApp
        </div>
        <div className="relative space-y-8">
          <p className="max-w-md text-4xl leading-tight font-bold tracking-tight">
            Organisez votre travail, simplement.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-indigo-50">
                <span className="grid size-9 place-items-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <Icon className="size-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-indigo-100/80">
          Vos données sont privées et protégées.
        </p>
      </aside>

      {/* Formulaire */}
      <main className="relative flex items-center justify-center px-4 py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="animate-fade-in w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-6 flex items-center justify-center gap-2 text-xl font-bold lg:hidden">
              <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <LogoIcon className="size-5" />
              </span>
              TaskApp
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 shadow-slate-200/60 ring-slate-200 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
            {children}
          </div>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">{footer}</p>
        </div>
      </main>
    </div>
  );
}
