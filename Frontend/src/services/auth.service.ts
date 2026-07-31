import { apiFetch } from './api';
import { AuthResponseData, User, ApiResponse } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name?: string;
}

export const authService = {
  login: async (params: LoginParams): Promise<ApiResponse<AuthResponseData>> => {
    return apiFetch<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  register: async (params: RegisterParams): Promise<ApiResponse<AuthResponseData>> => {
    return apiFetch<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiFetch<{ user: User }>('/auth/me', {
      method: 'GET',
    });
  },
};
