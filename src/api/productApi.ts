import { apiClient } from './client';
import type { Product } from 'shared/types';

export const productApi = {
  getList: (params?: { keyword?: string }) => {
    return apiClient.get<Product[]>('/products', { params });
  },

  getById: (id: number) => {
    return apiClient.get<Product>(`/products/${id}`);
  },

  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Product>('/products', data);
  },

  update: (id: number, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  remove: (id: number) => {
    return apiClient.delete(`/products/${id}`);
  },
};

export default productApi;
