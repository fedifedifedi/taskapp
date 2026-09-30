import { Link, Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useLogout } from '../features/auth/hooks';
import { Button } from './Button';

export function Layout() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/tasks" className="text-lg font-bold text-indigo-600">
            TaskApp
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-slate-600 sm:inline" data-testid="current-user">
                {user.name}
              </span>
            )}
            <Button
              variant="secondary"
              loading={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSettled: () => void navigate('/login') })}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
