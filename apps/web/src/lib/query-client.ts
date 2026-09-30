import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { CURRENT_USER_KEY } from '../features/auth/hooks';

function isClientError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function createQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    // Session expirée pendant l'utilisation : on vide l'utilisateur courant,
    // ProtectedRoute redirige alors vers /login.
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
    defaultOptions: {
      queries: {
        // Inutile de réessayer une erreur 4xx : elle se reproduira.
        retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
        refetchOnWindowFocus: false,
      },
    },
  });

  function handleUnauthorized(error: Error) {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData(CURRENT_USER_KEY, null);
    }
  }

  return queryClient;
}
