import type { LoginInput, RegisterInput, UserDto } from '@taskapp/shared';
import { ApiError, apiRequest } from './client';

export const authApi = {
  /** Renvoie null si aucune session valide (401). */
  async me(): Promise<UserDto | null> {
    try {
      const { data } = await apiRequest<{ data: UserDto }>('/auth/me');
      return data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  async login(input: LoginInput): Promise<UserDto> {
    const { data } = await apiRequest<{ data: UserDto }>('/auth/login', {
      method: 'POST',
      body: input,
    });
    return data;
  },

  async register(input: RegisterInput): Promise<UserDto> {
    const { data } = await apiRequest<{ data: UserDto }>('/auth/register', {
      method: 'POST',
      body: input,
    });
    return data;
  },

  logout(): Promise<void> {
    return apiRequest<void>('/auth/logout', { method: 'POST' });
  },
};
