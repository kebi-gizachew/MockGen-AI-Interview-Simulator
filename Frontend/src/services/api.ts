import { API_BASE_URL, LOCAL_STORAGE_KEYS } from '../utils/constants';
import { ApiResponse, ApiErrorResponse } from '../types';

export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ApiErrorResponse;
      if (response.status === 401) {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      }
      // Carry the HTTP status so callers can react to specific codes (e.g.
      // 410 = interview time expired → route to the debrief).
      const error = new Error(errorData.message || 'An unexpected API error occurred.') as Error & {
        status?: number;
      };
      error.status = response.status;
      throw error;
    }

    return data as ApiResponse<T>;
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Unable to connect to the backend server at ${API_BASE_URL}. Please verify the server is running and accessible.`
      );
    }
    throw err;
  }
};
