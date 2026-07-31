export type SessionStatus = 'active' | 'completed';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageMetadata {
  type?: 'question' | 'feedback' | 'summary';
  score?: number;
}

export interface Message {
  id: string;
  interviewSessionId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodeSubmission {
  id: string;
  interviewSessionId: string;
  language: string;
  code: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId?: string;
  title: string;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
    codeSubmissions: number;
  };
  messages?: Message[];
}

export interface ApiResponse<T> {
  status: 'success';
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedSessionsResponse {
  sessions: InterviewSession[];
  pagination: PaginationMeta;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface StartInterviewResponseData {
  session: InterviewSession;
  openingMessage: Message;
  aiResponse?: {
    type: string;
    message: string;
    score?: number;
  };
}

export interface ChatResponseData {
  userMessage: Message;
  assistantMessage: Message;
  aiResponse?: {
    type: string;
    message: string;
    score?: number;
  };
}

export interface EndInterviewResponseData {
  session: InterviewSession;
  summaryMessage: Message;
  aiResponse?: {
    type: string;
    message: string;
    score?: number;
  };
}

export interface SocketAiResponsePayload {
  userMessage: Message;
  assistantMessage: Message;
  aiResponse?: {
    type: string;
    message: string;
    score?: number;
  };
}
