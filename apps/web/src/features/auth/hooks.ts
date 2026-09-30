import type { UserDto } from '@taskapp/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';

export const CURRENT_USER_KEY = ['auth', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
  });
}

function useSetSession() {
  const queryClient = useQueryClient();
  return (user: UserDto) => {
    // Nouvelle session : on repart d'un cache vierge (aucune donnée d'un autre compte).
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    queryClient.setQueryData(CURRENT_USER_KEY, user);
  };
}

export function useLogin() {
  const setSession = useSetSession();
  return useMutation({ mutationFn: authApi.login, onSuccess: setSession });
}

export function useRegister() {
  const setSession = useSetSession();
  return useMutation({ mutationFn: authApi.register, onSuccess: setSession });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(CURRENT_USER_KEY, null);
    },
  });
}
