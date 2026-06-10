import { apiClient } from './client';
import type { Order, CreateOrderRequest } from 'shared/types';

export const orderApi = {
  getList: (params?: { page?: number; pageSize?: number; status?: string }) => {
    return apiClient.get<{ list: Order[]; total: number }>('/orders', { params });
  },

  getById: (id: number) => {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  create: (data: CreateOrderRequest) => {
    return apiClient.post<Order>('/orders', data);
  },

  update: (id: number, data: Partial<CreateOrderRequest>) => {
    return apiClient.put<Order>(`/orders/${id}`, data);
  },

  remove: (id: number) => {
    return apiClient.delete(`/orders/${id}`);
  },

  updateStatus: (id: number, status: Order['status']) => {
    return apiClient.put<Order>(`/orders/${id}/status`, { status });
  },
};

export default orderApi;
