import { apiFetch } from './api';
import {
  ApiResponse,
  InterviewSession,
  PaginatedSessionsResponse,
  StartInterviewResponseData,
  ChatResponseData,
  EndInterviewResponseData,
  CodeSubmission,
  Message,
  SessionStatus,
} from '../types';

export interface GetSessionsOptions {
  status?: SessionStatus;
  page?: number;
  limit?: number;
}

export interface SubmitCodeParams {
  language: string;
  code: string;
  notes?: string;
}

export const interviewService = {
  createSession: async (title?: string): Promise<ApiResponse<StartInterviewResponseData>> => {
    return apiFetch<StartInterviewResponseData>('/interviews', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'Mock Interview' }),
    });
  },

  getUserSessions: async (
    options: GetSessionsOptions = {}
  ): Promise<ApiResponse<PaginatedSessionsResponse>> => {
    const query = new URLSearchParams();
    if (options.status) query.append('status', options.status);
    if (options.page) query.append('page', options.page.toString());
    if (options.limit) query.append('limit', options.limit.toString());

    const queryString = query.toString();
    const endpoint = `/interviews${queryString ? `?${queryString}` : ''}`;

    return apiFetch<PaginatedSessionsResponse>(endpoint, {
      method: 'GET',
    });
  },

  getSessionById: async (sessionId: string): Promise<ApiResponse<{ session: InterviewSession }>> => {
    return apiFetch<{ session: InterviewSession }>(`/interviews/${sessionId}`, {
      method: 'GET',
    });
  },

  updateSession: async (
    sessionId: string,
    title: string
  ): Promise<ApiResponse<{ session: InterviewSession }>> => {
    return apiFetch<{ session: InterviewSession }>(`/interviews/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  deleteSession: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiFetch<{ message: string }>(`/interviews/${sessionId}`, {
      method: 'DELETE',
    });
  },

  sendChatMessage: async (
    sessionId: string,
    message: string
  ): Promise<ApiResponse<ChatResponseData>> => {
    return apiFetch<ChatResponseData>(`/interviews/${sessionId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  endInterview: async (sessionId: string): Promise<ApiResponse<EndInterviewResponseData>> => {
    return apiFetch<EndInterviewResponseData>(`/interviews/${sessionId}/end`, {
      method: 'POST',
    });
  },

  submitCode: async (
    sessionId: string,
    params: SubmitCodeParams
  ): Promise<ApiResponse<{ submission: CodeSubmission }>> => {
    return apiFetch<{ submission: CodeSubmission }>(`/interviews/${sessionId}/code`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getCodeSubmissions: async (
    sessionId: string
  ): Promise<ApiResponse<{ submissions: CodeSubmission[] }>> => {
    return apiFetch<{ submissions: CodeSubmission[] }>(`/interviews/${sessionId}/code`, {
      method: 'GET',
    });
  },

  deleteCodeSubmission: async (
    sessionId: string,
    submissionId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiFetch<{ message: string }>(`/interviews/${sessionId}/code/${submissionId}`, {
      method: 'DELETE',
    });
  },

  saveRawMessage: async (
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ApiResponse<{ message: Message }>> => {
    return apiFetch<{ message: Message }>(`/interviews/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content, metadata }),
    });
  },
};
