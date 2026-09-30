import type {
  CreateTaskInput,
  PaginatedResponse,
  TaskDto,
  TaskStatus,
  UpdateTaskInput,
} from '@taskapp/shared';
import { apiRequest } from './client';

export interface TaskListParams {
  status?: TaskStatus;
  page: number;
  limit: number;
}

export const tasksApi = {
  list({ status, page, limit }: TaskListParams): Promise<PaginatedResponse<TaskDto>> {
    const search = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) search.set('status', status);
    return apiRequest(`/tasks?${search.toString()}`);
  },

  async create(input: CreateTaskInput): Promise<TaskDto> {
    const { data } = await apiRequest<{ data: TaskDto }>('/tasks', { method: 'POST', body: input });
    return data;
  },

  async update(id: string, input: UpdateTaskInput): Promise<TaskDto> {
    const { data } = await apiRequest<{ data: TaskDto }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: input,
    });
    return data;
  },

  async complete(id: string): Promise<TaskDto> {
    const { data } = await apiRequest<{ data: TaskDto }>(`/tasks/${id}/complete`, {
      method: 'PATCH',
    });
    return data;
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
