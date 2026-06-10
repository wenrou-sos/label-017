import { apiClient } from './client';
import type { Machine } from 'shared/types';

export const machineApi = {
  getList: (params?: { status?: string; type?: string }) => {
    return apiClient.get<Machine[]>('/machines', { params });
  },

  getById: (id: number) => {
    return apiClient.get<Machine>(`/machines/${id}`);
  },

  create: (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Machine>('/machines', data);
  },

  update: (id: number, data: Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>) => {
    return apiClient.put<Machine>(`/machines/${id}`, data);
  },

  remove: (id: number) => {
    return apiClient.delete(`/machines/${id}`);
  },

  updateStatus: (id: number, status: Machine['status']) => {
    return apiClient.put<Machine>(`/machines/${id}/status`, { status });
  },
};

export default machineApi;
