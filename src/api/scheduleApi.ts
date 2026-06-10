import { apiClient } from './client';
import type { Schedule, CreateScheduleRequest, CheckConflictRequest, ConflictInfo } from 'shared/types';

export const scheduleApi = {
  getList: (params?: { startDate?: string; endDate?: string; machineId?: number }) => {
    return apiClient.get<Schedule[]>('/schedules', { params });
  },

  getById: (id: number) => {
    return apiClient.get<Schedule>(`/schedules/${id}`);
  },

  create: (data: CreateScheduleRequest) => {
    return apiClient.post<Schedule>('/schedules', data);
  },

  update: (id: number, data: Partial<CreateScheduleRequest>) => {
    return apiClient.put<Schedule>(`/schedules/${id}`, data);
  },

  remove: (id: number) => {
    return apiClient.delete(`/schedules/${id}`);
  },

  checkConflict: (data: CheckConflictRequest) => {
    return apiClient.post<ConflictInfo>('/schedules/check-conflict', data);
  },

  batchUpdate: (data: { schedules: Partial<Schedule>[] }) => {
    return apiClient.put<Schedule[]>('/schedules/batch', data);
  },
};

export default scheduleApi;
