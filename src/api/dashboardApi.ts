import { apiClient } from './client';
import type { DashboardStats, MachineLoad, OperationLog } from 'shared/types';

export const dashboardApi = {
  getStats: () => {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },

  getMachineLoads: (params?: { startDate?: string; endDate?: string }) => {
    return apiClient.get<MachineLoad[]>('/dashboard/machine-loads', { params });
  },

  getRecentLogs: (limit?: number) => {
    return apiClient.get<OperationLog[]>('/dashboard/recent-logs', { params: { limit } });
  },
};

export default dashboardApi;
