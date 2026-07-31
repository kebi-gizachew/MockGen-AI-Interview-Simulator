export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'ai_interview_token',
  USER: 'ai_interview_user',
} as const;

export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const SOCKET_EVENTS = {
  JOIN_SESSION: 'join_session',
  JOINED_SESSION: 'joined_session',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  AI_RESPONSE: 'ai_response',
  ERROR: 'socket_error',
} as const;
