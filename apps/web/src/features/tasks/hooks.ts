import type { UpdateTaskInput } from '@taskapp/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type TaskListParams } from '../../api/tasks';

const TASKS_KEY = ['tasks'] as const;

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: [...TASKS_KEY, params],
    queryFn: () => tasksApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Compteurs du tableau de bord (rechargés avec les listes après chaque écriture). */
export function useTaskStats() {
  return useQuery({ queryKey: [...TASKS_KEY, 'stats'], queryFn: tasksApi.stats });
}

/** Après chaque écriture, les listes sont rechargées (filtres et pagination restent justes). */
function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: TASKS_KEY });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({ mutationFn: tasksApi.create, onSuccess: invalidate });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      tasksApi.update(id, input),
    onSettled: invalidate,
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({ mutationFn: tasksApi.complete, onSettled: invalidate });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({ mutationFn: tasksApi.remove, onSuccess: invalidate });
}
