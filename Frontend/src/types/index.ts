export type SessionStatus = 'active' | 'completed';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  provider?: string;
  isVerified?: boolean;
  createdAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageMetadata {
  type?: 'question' | 'feedback' | 'summary' | 'system';
  score?: number;
  question?: Question | null;
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
  result?: CodeRunResult | null;
  passedTests?: number | null;
  totalTests?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId?: string;
  title: string;
  company?: string | null;
  role?: string | null;
  difficulty?: Difficulty | null;
  language?: string | null;
  durationMinutes?: number | null;
  score?: number | null;
  questionId?: string | null;
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
  question?: Question | null;
}

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  company?: string | null;
  // Every company known to ask this question (many-to-many).
  companies?: string[] | null;
  // Interview role relevance, e.g. ['Backend Engineer', 'Full Stack Engineer']
  roles?: string[] | null;
  frequencyRank?: number | null;
  interviewFrequency?: string | null;
  functionName: string;
  examples?: QuestionExample[] | null;
  constraints?: string[] | null;
  testCases: { input: unknown[]; expected: unknown }[];
  starterCode: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type HiringRecommendation =
  | 'Strong Hire'
  | 'Hire'
  | 'Leaning Hire'
  | 'Needs Improvement'
  | 'Not Ready Yet';

export interface Feedback {
  id: string;
  interviewSessionId: string;
  score: number;
  problemSolving?: number | null;
  codeQuality?: number | null;
  communication?: number | null;
  optimization?: number | null;
  recommendation?: HiringRecommendation | string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseResult {
  input: unknown[] | null;
  expected: unknown;
  actual: unknown | null;
  passed: boolean;
  error?: string;
}

export interface CodeRunResult {
  passed: number;
  failed: number;
  total: number;
  results: TestCaseResult[];
  consoleOutput?: string[];
  runtimeMs?: number;
  memoryKb?: number | null;
  error?: string;
}

export interface PublicStats {
  registeredUsers: number;
  completedInterviews: number;
  codeSubmissions: number;
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
  feedback?: Feedback | null;
  aiResponse?: {
    type: string;
    message: string;
    score?: number;
  };
}

export interface StartInterviewConfig {
  title?: string;
  company?: string;
  role?: string;
  difficulty?: Difficulty;
  language?: Language;
  durationMinutes?: number;
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
