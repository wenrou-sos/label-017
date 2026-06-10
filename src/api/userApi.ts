import { apiClient } from './client';
import type { User } from 'shared/types';

export const userApi = {
  getList: (params?: { role?: string; status?: string }) => {
    return apiClient.get<User[]>('/users', { params });
  },

  getById: (id: number) => {
    return apiClient.get<User>(`/users/${id}`);
  },

  create: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }) => {
    return apiClient.post<User>('/users', data);
  },

  update: (id: number, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  remove: (id: number) => {
    return apiClient.delete(`/users/${id}`);
  },

  updateStatus: (id: number, status: User['status']) => {
    return apiClient.put<User>(`/users/${id}/status`, { status });
  },

  resetPassword: (id: number, newPassword: string) => {
    return apiClient.put(`/users/${id}/password`, { password: newPassword });
  },
};

export default userApi;
