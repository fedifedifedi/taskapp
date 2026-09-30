import { Link, Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useLogout } from '../features/auth/hooks';
import { Button } from './Button';
import { LogoIcon, LogOutIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Layout() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/tasks" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
              <LogoIcon className="size-5" />
            </span>
            <span className="text-lg">TaskApp</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {user && (
              <div className="hidden items-center gap-2 sm:flex">
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                >
                  {initials(user.name)}
                </span>
                <span
                  className="max-w-40 truncate text-sm font-medium text-slate-700 dark:text-slate-300"
                  data-testid="current-user"
                >
                  {user.name}
                </span>
              </div>
            )}
            <Button
              variant="secondary"
              loading={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSettled: () => void navigate('/login') })}
            >
              <LogOutIcon />
              <span className="hidden sm:inline">Se déconnecter</span>
              <span className="sr-only sm:hidden">Se déconnecter</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
