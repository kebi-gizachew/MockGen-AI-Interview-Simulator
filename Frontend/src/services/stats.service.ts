import { apiFetch } from './api';
import { ApiResponse, PublicStats } from '../types';

/**
 * Fetches aggregate platform statistics (registered users, completed
 * interviews, code submissions). Public endpoint — no auth token needed.
 */
export const getPublicStats = async (): Promise<ApiResponse<PublicStats>> => {
  return apiFetch<PublicStats>('/stats', {
    method: 'GET',
  });
};
