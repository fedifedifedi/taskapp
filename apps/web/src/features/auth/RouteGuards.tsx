import { Navigate, Outlet, useLocation } from 'react-router';
import { ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { useCurrentUser } from './hooks';

/** Pages réservées aux utilisateurs connectés. */
export function ProtectedRoute() {
  const { data: user, isPending, isError } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <Spinner />;
  if (isError) {
    return (
      <div className="mx-auto max-w-md p-6">
        <ErrorAlert>Impossible de vérifier votre session. Réessayez plus tard.</ErrorAlert>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Pages de connexion / inscription : inutiles si déjà connecté. */
export function PublicOnlyRoute() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <Spinner />;
  if (user) return <Navigate to="/tasks" replace />;
  return <Outlet />;
}
