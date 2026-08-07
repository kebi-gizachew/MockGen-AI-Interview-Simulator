import { apiFetch } from './api';
import {
  ApiResponse,
  InterviewSession,
  PaginatedSessionsResponse,
  StartInterviewResponseData,
  StartInterviewConfig,
  ChatResponseData,
  EndInterviewResponseData,
  CodeSubmission,
  CodeRunResult,
  Feedback,
  Question,
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
  createSession: async (config: StartInterviewConfig = {}): Promise<ApiResponse<StartInterviewResponseData>> => {
    return apiFetch<StartInterviewResponseData>('/interviews', {
      method: 'POST',
      body: JSON.stringify({
        title: config.title || 'Mock Interview',
        company: config.company,
        role: config.role,
        difficulty: config.difficulty,
        language: config.language,
        durationMinutes: config.durationMinutes,
      }),
    });
  },

  getRandomQuestion: async (
    options: { difficulty?: string; topic?: string; company?: string } = {}
  ): Promise<ApiResponse<{ question: Question }>> => {
    const query = new URLSearchParams();
    if (options.difficulty) query.append('difficulty', options.difficulty);
    if (options.topic) query.append('topic', options.topic);
    if (options.company) query.append('company', options.company);

    const queryString = query.toString();
    return apiFetch<{ question: Question }>(`/questions/random${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
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

  endInterview: async (
    sessionId: string,
    options: { autoExpired?: boolean } = {}
  ): Promise<ApiResponse<EndInterviewResponseData>> => {
    return apiFetch<EndInterviewResponseData>(`/interviews/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ autoExpired: Boolean(options.autoExpired) }),
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

  runCode: async (
    sessionId: string,
    language: string,
    code: string
  ): Promise<ApiResponse<{ result: CodeRunResult }>> => {
    return apiFetch<{ result: CodeRunResult }>(`/interviews/${sessionId}/code/run`, {
      method: 'POST',
      body: JSON.stringify({ language, code }),
    });
  },

  getFeedback: async (sessionId: string): Promise<ApiResponse<{ feedback: Feedback | null }>> => {
    return apiFetch<{ feedback: Feedback | null }>(`/interviews/${sessionId}/feedback`, {
      method: 'GET',
    });
  },
};
