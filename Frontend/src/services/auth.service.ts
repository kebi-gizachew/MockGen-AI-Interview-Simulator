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

  verifyEmail: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    return apiFetch<{ user: User }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },

  resendVerification: async (email: string): Promise<ApiResponse<{ email: string }>> => {
    return apiFetch<{ email: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getAuthConfig: async (): Promise<ApiResponse<AuthConfig>> => {
    return apiFetch<AuthConfig>('/auth/config', {
      method: 'GET',
    });
  },
};

export interface AuthConfig {
  googleEnabled: boolean;
  verificationRequired: boolean;
  frontendUrl: string;
}

export const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`;
