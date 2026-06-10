import { apiClient } from './client';
import type { LoginRequest, LoginResponse, User } from 'shared/types';

export const authApi = {
  login: (data: LoginRequest) => {
    return apiClient.post<LoginResponse>('/auth/login', data);
  },

  getCurrentUser: () => {
    return apiClient.get<User>('/auth/me');
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },
};

export default authApi;
