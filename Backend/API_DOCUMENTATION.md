# MockGen AI Interview Simulator - API Documentation

Welcome to the API Documentation for the **MockGen AI Interview Simulator** backend.

---

## 📌 General Information

- **Base URL**: `http://localhost:5000/api` (or your deployed server domain)
- **Protocol**: HTTP/HTTPS & WebSockets (Socket.IO v4)
- **Data Format**: `JSON` (`Content-Type: application/json`)

---

## 🔑 Authentication

Most endpoints require JWT Authentication using the standard HTTP Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

For **Socket.IO** connections, authentication is passed during handshake:

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "<your_jwt_token>"
  }
});
```

---

## 📊 Standard API Response Formats

### Success Response Format
All successful REST responses return HTTP status codes `200 OK` or `201 Created` with a uniform JSON structure:

```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response Format
All error responses return HTTP status codes (`400`, `401`, `404`, `409`, `500`, `503`) with a uniform JSON structure:

```json
{
  "status": "error",
  "message": "Detailed error message describing what went wrong."
}
```

#### Common HTTP Status Codes
| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200` | OK | Request succeeded. |
| `201` | Created | Resource successfully created. |
| `400` | Bad Request | Missing required fields, invalid parameters, or inactive session. |
| `401` | Unauthorized | Missing, invalid, or expired JWT token. |
| `404` | Not Found | Requested resource (session, submission, route) does not exist. |
| `409` | Conflict | Account with provided email already exists. |
| `410` | Gone | Interview duration expired — session auto-completed, report ready. |
| `500` | Internal Server Error | Unexpected server error. |
| `503` | Service Unavailable | Database schema uninitialized or database unavailable. |

---

## 🗄️ Core Data Schemas

### User
```typescript
interface User {
  id: string;              // CUID
  email: string;           // Unique email
  name?: string | null;
  avatar?: string | null;  // Profile picture (Google OAuth)
  provider?: string;       // "email" | "google"
  isVerified?: boolean;    // Email verification status
  createdAt: string;       // ISO 8601 Timestamp
}
```

### InterviewSession
```typescript
type SessionStatus = "active" | "completed";
type Difficulty = "easy" | "medium" | "hard";

interface InterviewSession {
  id: string;             // CUID
  userId: string;
  title: string;
  company?: string | null;        // e.g. "Google"
  role?: string | null;           // e.g. "Backend Engineer"
  difficulty?: Difficulty | null;
  language?: string | null;       // e.g. "javascript"
  durationMinutes?: number | null;
  score?: number | null;          // Final AI score (0-100), set on completion
  questionId?: string | null;     // Assigned coding problem
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
  question?: Question | null;     // Included when requested
}
```

### Question
```typescript
interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;                  // e.g. "Arrays & Hashing"
  company?: string | null;
  frequencyRank?: number | null;  // 1 = most frequently reported at this company
  interviewFrequency?: string | null; // "very_high" | "high" | "medium" | "low"
  functionName: string;           // Function candidates must implement
  argTypes?: string[] | null;     // Optional per-arg type hints (e.g. ["tree"] for tree inputs)
  examples?: { input: string; output: string; explanation?: string }[] | null;
  constraints?: string[] | null;
  testCases: { input: unknown[]; expected: unknown }[];
  starterCode: Record<string, string>;  // keyed by language id
}
```

### Feedback
```typescript
interface Feedback {
  id: string;
  interviewSessionId: string;
  score: number;
  problemSolving?: number | null;
  codeQuality?: number | null;
  communication?: number | null;
  optimization?: number | null;
  recommendation?: string | null; // "Strong Hire" | "Hire" | "Leaning Hire" | "Needs Improvement" | "Not Ready Yet"
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}
```

### Message
```typescript
type MessageRole = "user" | "assistant" | "system";

interface Message {
  id: string;
  interviewSessionId: string;
  role: MessageRole;
  content: string;
  metadata?: {
    type?: "question" | "feedback" | "summary";
    score?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}
```

### CodeSubmission
```typescript
interface CodeSubmission {
  id: string;
  interviewSessionId: string;
  language: string;
  code: string;
  notes?: string | null;
  result?: {
    passed: number;
    failed: number;
    total: number;
    results: { input: unknown[]; expected: unknown; actual: unknown; passed: boolean; error?: string }[];
    consoleOutput?: string[];
    runtimeMs?: number;
    memoryKb?: number | null;
    error?: string;
  } | null;
  passedTests?: number | null;
  totalTests?: number | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🏥 Health Check

### 1. Check Server & Database Status

Returns server health status and verifies database connectivity.

- **Method**: `GET`
- **URL**: `/api/health`
- **Authentication**: None

#### Example Request
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "uptime": 124.52,
    "timestamp": "2026-07-31T13:45:00.000Z"
  }
}
```

#### Possible Errors
- `503 Service Unavailable`: Database unreachable.

---

## 🔐 Authentication Endpoints

### 1. Register User

Creates a new candidate account.

- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Authentication**: None

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | User email address. |
| `password` | `string` | **Yes** | Must satisfy the full password policy (see below). |
| `name` | `string` | No | User display name. |

**Password policy (enforced server-side; frontend shows a live checklist):**
- At least 8 characters
- At least one uppercase letter (`A-Z`)
- At least one lowercase letter (`a-z`)
- At least one number (`0-9`)
- At least one special character (e.g. `! @ # $ % ^ & *`)

```json
{
  "email": "candidate@example.com",
  "password": "MockGenAI2026!",
  "name": "Jane Candidate"
}
```

On success a professional **welcome email** (MockGen AI branded, no verification wording) is sent to the address. Accounts are active immediately (`isVerified: true`). If SMTP is not configured, the email is logged to the server console; SMTP connectivity is verified once at boot and send failures log the host, recipient and subject.

#### Successful Response (`201 Created`)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm7a1b2c30000abc123456789",
      "email": "candidate@example.com",
      "name": "Jane Candidate",
      "provider": "email",
      "isVerified": true,
      "createdAt": "2026-07-31T13:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Possible Errors
- `400 Bad Request`: Email/password missing, invalid email, or password fails the policy (the message lists every failed rule).
- `409 Conflict`: An account with this email already exists.

---

### 2. Login User

Authenticates an existing user and returns a JWT token.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Authentication**: None

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Registered email address. |
| `password` | `string` | **Yes** | User password. |

```json
{
  "email": "candidate@example.com",
  "password": "securepassword123"
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm7a1b2c30000abc123456789",
      "email": "candidate@example.com",
      "name": "Jane Candidate",
      "createdAt": "2026-07-31T13:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Possible Errors
- `400 Bad Request`: Missing email or password.
- `401 Unauthorized`: Invalid email or password.

---

### 3. Get Auth Configuration

Returns which authentication providers are enabled on this deployment (used by the frontend to show/hide the Google button).

- **Method**: `GET`
- **URL**: `/api/auth/config`
- **Authentication**: None

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "googleEnabled": true,
    "verificationRequired": false,
    "frontendUrl": "http://localhost:5173"
  }
}
```

---

### 4. Verify Email Address

Verifies a user's email address using the one-time token from the verification email. The token is stored hashed (SHA-256) server-side and expires after 24 hours.

- **Method**: `GET`
- **URL**: `/api/auth/verify-email?token=<token>`
- **Authentication**: None

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm7a1b2c30000abc123456789",
      "email": "candidate@example.com",
      "name": "Jane Candidate",
      "provider": "email",
      "isVerified": true,
      "createdAt": "2026-07-31T13:45:00.000Z"
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Missing/invalid token, token already used, or token expired.

---

### 5. Resend Verification Email

Issues a fresh verification token and emails it to the account. Registration already sends one email; this endpoint covers lost/expired links.

- **Method**: `POST`
- **URL**: `/api/auth/resend-verification`
- **Authentication**: None

#### Request Body
```json
{ "email": "candidate@example.com" }
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": { "email": "candidate@example.com" }
}
```

#### Possible Errors
- `400 Bad Request`: Account already verified, or account uses Google sign-in.
- `404 Not Found`: No account with this email.

---

### 6. Get Current User Profile

Retrieves profile information for the authenticated user.

- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "cm7a1b2c30000abc123456789",
      "email": "candidate@example.com",
      "name": "Jane Candidate",
      "provider": "email",
      "isVerified": true,
      "createdAt": "2026-07-31T13:45:00.000Z"
    }
  }
}
```

#### Possible Errors
- `401 Unauthorized`: Missing, invalid, or expired JWT.

---

### 7. Google OAuth

Sign up / sign in with Google. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the backend (routes are only mounted when configured).

- **Method**: `GET`
- **URL**: `/api/auth/google` — redirects the browser to Google's consent screen.
- **URL**: `/api/auth/google/callback` — Google redirects back here; the backend finds-or-creates the user (linking by `googleId`, then by email for existing password accounts) and redirects the browser to `FRONTEND_URL/auth/google/callback?token=...&user=...`.

Google accounts are treated as verified (Google validates the address). If an existing email/password account matches the Google email, the accounts are linked: the Google ID is attached and the account is marked verified.

#### Possible Errors
- Redirect to `/login?google=error` when Google denies or returns an invalid profile.

---

## 🎯 Interview Session Endpoints

### 1. Start / Create New Interview Session

Initializes a new interview session and generates the opening AI question.

- **Method**: `POST`
- **URL**: `/api/interviews`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | No | Title of session. Defaults to `"Mock Interview"`. |
| `company` | `string` | No | Target company (e.g., `"Google"`). |
| `role` | `string` | No | Target role (e.g., `"Backend Engineer"`). |
| `difficulty` | `string` | No | `"easy"` \| `"medium"` \| `"hard"`. |
| `language` | `string` | No | `"python"` \| `"java"` \| `"cpp"` \| `"javascript"` \| `"typescript"`. |
| `durationMinutes` | `number` | No | `30` \| `45` \| `60`. |

A matching coding question is automatically assigned to the session.

```json
{
  "company": "Google",
  "role": "Backend Engineer",
  "difficulty": "medium",
  "language": "javascript",
  "durationMinutes": 45
}
```

#### Successful Response (`201 Created`)
```json
{
  "status": "success",
  "data": {
    "session": {
      "id": "cm7session123456789",
      "title": "System Design & Node.js Architecture",
      "status": "active",
      "startedAt": "2026-07-31T13:46:00.000Z",
      "endedAt": null,
      "createdAt": "2026-07-31T13:46:00.000Z",
      "updatedAt": "2026-07-31T13:46:00.000Z"
    },
    "openingMessage": {
      "id": "cm7msg111111111",
      "interviewSessionId": "cm7session123456789",
      "role": "assistant",
      "content": "Welcome to your System Design & Node.js Architecture interview. Let's begin: explain how you would design a rate limiter service for a high-throughput public API.",
      "metadata": {
        "type": "question",
        "score": 0
      },
      "createdAt": "2026-07-31T13:46:01.000Z",
      "updatedAt": "2026-07-31T13:46:01.000Z"
    },
    "aiResponse": {
      "type": "question",
      "message": "Welcome to your System Design & Node.js Architecture interview. Let's begin: explain how you would design a rate limiter service for a high-throughput public API.",
      "score": 0
    }
  }
}
```

---

### 2. List Candidate Interview Sessions

Retrieves paginated interview sessions for the authenticated user.

- **Method**: `GET`
- **URL**: `/api/interviews`
- **Authentication**: **Required** (`Bearer <token>`)
- **Query Parameters**:
  - `status` (optional): Filter by `"active"` or `"completed"`.
  - `page` (optional): Page number (default: `1`).
  - `limit` (optional): Items per page (default: `20`, max: `100`).

#### Example Request
```http
GET /api/interviews?status=active&page=1&limit=10 HTTP/1.1
Authorization: Bearer <token>
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "id": "cm7session123456789",
        "title": "System Design & Node.js Architecture",
        "status": "active",
        "startedAt": "2026-07-31T13:46:00.000Z",
        "endedAt": null,
        "createdAt": "2026-07-31T13:46:00.000Z",
        "updatedAt": "2026-07-31T13:46:00.000Z",
        "_count": {
          "messages": 1,
          "codeSubmissions": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Invalid status filter parameter.

---

### 3. Get Single Interview Session Details

Retrieves details of a specific interview session, including full message history.

- **Method**: `GET`
- **URL**: `/api/interviews/:id`
- **Authentication**: **Required** (`Bearer <token>`)

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "session": {
      "id": "cm7session123456789",
      "userId": "cm7a1b2c30000abc123456789",
      "title": "System Design & Node.js Architecture",
      "status": "active",
      "startedAt": "2026-07-31T13:46:00.000Z",
      "endedAt": null,
      "createdAt": "2026-07-31T13:46:00.000Z",
      "updatedAt": "2026-07-31T13:46:00.000Z",
      "messages": [
        {
          "id": "cm7msg111111111",
          "interviewSessionId": "cm7session123456789",
          "role": "assistant",
          "content": "Welcome to your System Design & Node.js Architecture interview...",
          "metadata": {
            "type": "question",
            "score": 0
          },
          "createdAt": "2026-07-31T13:46:01.000Z",
          "updatedAt": "2026-07-31T13:46:01.000Z"
        }
      ]
    }
  }
}
```

#### Possible Errors
- `404 Not Found`: Interview session not found or does not belong to user.

---

### 4. Update Interview Session

Updates session properties such as title.

- **Method**: `PATCH`
- **URL**: `/api/interviews/:id`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body
```json
{
  "title": "Senior Backend Technical Interview"
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "session": {
      "id": "cm7session123456789",
      "title": "Senior Backend Technical Interview",
      "status": "active",
      "startedAt": "2026-07-31T13:46:00.000Z",
      "endedAt": null,
      "createdAt": "2026-07-31T13:46:00.000Z",
      "updatedAt": "2026-07-31T13:48:00.000Z"
    }
  }
}
```

---

### 5. Delete Interview Session

Deletes an interview session and all associated messages and code submissions (cascade delete).

- **Method**: `DELETE`
- **URL**: `/api/interviews/:id`
- **Authentication**: **Required** (`Bearer <token>`)

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "message": "Interview session deleted."
  }
}
```

---

## 🤖 AI Interview Chat & Interaction Endpoints

### 1. Send Candidate Message & Get AI Response

Sends a candidate response to the active interview session, saves the exchange, and returns the AI interviewer's follow-up or feedback.

- **Method**: `POST`
- **URL**: `/api/interviews/:id/chat`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `message` | `string` | **Yes** | Candidate's answer or message. |

```json
{
  "message": "I would use a Sliding Window Counter algorithm backed by Redis to store request timestamps per IP or user token."
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "userMessage": {
      "id": "cm7msg222222222",
      "interviewSessionId": "cm7session123456789",
      "role": "user",
      "content": "I would use a Sliding Window Counter algorithm backed by Redis...",
      "metadata": null,
      "createdAt": "2026-07-31T13:50:00.000Z",
      "updatedAt": "2026-07-31T13:50:00.000Z"
    },
    "assistantMessage": {
      "id": "cm7msg333333333",
      "interviewSessionId": "cm7session123456789",
      "role": "assistant",
      "content": "Great choice with Redis and sliding window counters. How would you handle Redis node failures in a distributed cluster?",
      "metadata": {
        "type": "feedback",
        "score": 85
      },
      "createdAt": "2026-07-31T13:50:02.000Z",
      "updatedAt": "2026-07-31T13:50:02.000Z"
    },
    "aiResponse": {
      "type": "feedback",
      "message": "Great choice with Redis and sliding window counters. How would you handle Redis node failures in a distributed cluster?",
      "score": 85
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Empty message string OR interview session is completed/inactive.
- `404 Not Found`: Interview session not found.
- `410 Gone`: The session's configured duration has elapsed — the server already closed the interview and generated the report; the client should route to the debrief.

---

### 2. End Interview & Generate Final Summary

Ends an active interview session, marks status as `completed`, records `endedAt`, and generates a comprehensive performance debrief summary.

- **Method**: `POST`
- **URL**: `/api/interviews/:id/end`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body (optional)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `autoExpired` | `boolean` | No | `true` when the duration elapsed — the AI adds a professional "time's up" closing message before the report. The chat/submission endpoints auto-complete expired sessions and answer `410` with `TIME_EXPIRED_MESSAGE`. |

```json
{ "autoExpired": true }
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "session": {
      "id": "cm7session123456789",
      "title": "System Design & Node.js Architecture",
      "status": "completed",
      "startedAt": "2026-07-31T13:46:00.000Z",
      "endedAt": "2026-07-31T13:55:00.000Z",
      "createdAt": "2026-07-31T13:46:00.000Z",
      "updatedAt": "2026-07-31T13:55:00.000Z"
    },
    "summaryMessage": {
      "id": "cm7msg999999999",
      "interviewSessionId": "cm7session123456789",
      "role": "assistant",
      "content": "Interview complete. You answered 4 exchanges. Strengths: strong architectural intuition, clear explanation of Redis. Areas to improve: discuss edge cases and failover mechanisms more proactively.",
      "metadata": {
        "type": "summary",
        "score": 88
      },
      "createdAt": "2026-07-31T13:55:01.000Z",
      "updatedAt": "2026-07-31T13:55:01.000Z"
    },
    "aiResponse": {
      "type": "summary",
      "message": "Interview complete. You answered 4 exchanges. Strengths: strong architectural intuition, clear explanation of Redis...",
      "score": 88
    },
    "feedback": {
      "id": "cm7fb111111111",
      "score": 88,
      "problemSolving": 85,
      "codeQuality": 90,
      "communication": 92,
      "optimization": 84,
      "recommendation": "Hire",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "recommendations": ["..."],
      "summary": "..."
    }
  }
}
```

The session `score` field is also persisted with the final AI score.

**Hiring recommendation:** the debrief includes a hiring-committee verdict derived from the score — `Strong Hire` (≥85), `Hire` (≥70), `Leaning Hire` (≥55), `Needs Improvement` (≥40), `Not Ready Yet` (<40). The verdict is enforced server-side against the score, so the model can never recommend positively for an interview that produced no runnable/passing code.

**Evidence-based evaluation:** the summary is grounded in objective `performanceSignals` computed from the session — best test pass rate, improvement across submissions, hints requested, whether the approach/complexity/edge cases were discussed, and communication depth. Scores are never fixed or inflated: a candidate who passes all tests and explains well scores high; failing code, repeated hints and vague explanations score low.

#### Possible Errors
- `400 Bad Request`: Session is already completed.
- `404 Not Found`: Session not found.

---

## 💻 Code Execution & Submission Endpoints

### 1. Run Code Against Question Test Cases

Executes candidate code against the test cases of the session's assigned question. **All five languages execute for real**:

- `javascript` / `typescript` run in an in-process sandbox (`node:vm`) with eval/Function blocked and memory/time limits.
- `python`, `java` and `cpp` run in the remote Judge0 sandbox (real compilers/runtimes) when no local runtime is installed; Python also runs locally as a subprocess when a Python binary exists on the server.

Results are never simulated. Compile errors, runtime errors, timeouts, per-test pass/fail and execution time/memory are all reported truthfully. The remote judge URL is configurable via `JUDGE0_URL` (defaults to the free community instance `https://ce.judge0.com`; set `JUDGE0_API_KEY` for a private instance).

- **Method**: `POST`
- **URL**: `/api/interviews/:id/code/run`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `language` | `string` | **Yes** | `"javascript"` \| `"typescript"` \| `"python"` \| `"java"` \| `"cpp"`. |
| `code` | `string` | **Yes** | Code contents. Must define the question's function name exactly. |

```json
{
  "language": "javascript",
  "code": "function twoSum(nums, target) { /* ... */ }"
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "result": {
      "passed": 5,
      "failed": 0,
      "total": 5,
      "results": [
        { "input": [[2,7,11,15], 9], "expected": [0,1], "actual": [0,1], "passed": true }
      ],
      "consoleOutput": [],
      "runtimeMs": 3
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Session has no coding question assigned, or language/code missing.
- `404 Not Found`: Session not found.
- `5xx / error result`: judge service unreachable, rate-limited, compilation error, runtime error, or time limit exceeded (returned as `result.error`).

---

### 2. Submit Code Snippet

Stores code written by candidate, **runs it against the question test cases**, records the result, and creates a server-side system transcript note (clients cannot forge system messages).

- **Method**: `POST`
- **URL**: `/api/interviews/:id/code`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `language` | `string` | **Yes** | e.g. `"javascript"`, `"python"`, `"typescript"`. |
| `code` | `string` | **Yes** | Code contents. |
| `notes` | `string` | No | Candidate notes or commentary. |

```json
{
  "language": "javascript",
  "code": "function twoSum(nums, target) { /* ... */ }",
  "notes": "O(n) hash map approach."
}
```

#### Successful Response (`201 Created`)
```json
{
  "status": "success",
  "data": {
    "submission": {
      "id": "cm7code111111111",
      "interviewSessionId": "cm7session123456789",
      "language": "javascript",
      "code": "function twoSum(nums, target) { /* ... */ }",
      "notes": "O(n) hash map approach.",
      "passedTests": 5,
      "totalTests": 5,
      "result": { "passed": 5, "failed": 0, "total": 5, "results": [] },
      "createdAt": "2026-07-31T13:52:00.000Z",
      "updatedAt": "2026-07-31T13:52:00.000Z"
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Language or code missing OR interview session is completed.
- `404 Not Found`: Session not found.
- `410 Gone`: Session duration elapsed — no further submissions are accepted.

---

### 3. Get All Code Submissions for Session

Retrieves code submissions for a session in descending order of creation.

- **Method**: `GET`
- **URL**: `/api/interviews/:id/code`
- **Authentication**: **Required** (`Bearer <token>`)

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "id": "cm7code111111111",
        "interviewSessionId": "cm7session123456789",
        "language": "javascript",
        "code": "function rateLimiter(req) { ... }",
        "notes": "Initial draft of rate limiter helper function.",
        "createdAt": "2026-07-31T13:52:00.000Z",
        "updatedAt": "2026-07-31T13:52:00.000Z"
      }
    ]
  }
}
```

---

### 4. Delete Code Submission

Deletes a specific code submission by ID.

- **Method**: `DELETE`
- **URL**: `/api/interviews/:id/code/:submissionId`
- **Authentication**: **Required** (`Bearer <token>`)

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "message": "Code submission deleted."
  }
}
```

---

## 🎯 Question Endpoints

### Get Random Question

Returns a coding question for the authenticated user, optionally filtered by difficulty/topic/company.

- **Method**: `GET`
- **URL**: `/api/questions/random`
- **Authentication**: **Required** (`Bearer <token>`)
- **Query Parameters**: `difficulty`, `topic`, `company` (all optional)

**Company-frequency ranking:**
- Every question carries `frequencyRank` (1 = most frequently reported at its company) and `interviewFrequency` (`very_high` / `high` / `medium` / `low`), curated from widely reported real-interview frequency data.
- Selection prioritises the company's **most frequently reported** questions first, then frequent ones, then less common ones — a Google `easy`/`medium` screen surfaces Two Sum / Search in Rotated Sorted Array / Course Schedule before rarer problems.
- Once a highly ranked question has been solved, the next **highest-ranked available** question is picked (repeats are penalised ×0.2, recency ×0.35), so rotation stays realistic without repeating.

**Adaptive selection (per user):**
- The bundled bank holds **114 questions across 17 topics and 10 companies** (Google, Amazon, Meta, Microsoft, Apple, Netflix, Uber, Airbnb, Stripe, OpenAI), plus `argTypes` hints for linked-list/tree inputs.
- Questions the user has already worked on are avoided while a varied pool remains; questions from the most recent sessions (last 8) are additionally penalised so repeats feel rare.
- The user's role biases the topic pool (backend → graphs/DP/stack, frontend → trees/arrays/strings, ML → DP/arrays, etc.).
- The target company biases its known emphasis topics (e.g. Google → graphs/trees/DP, Amazon → arrays/greedy/union-find).
- Topics where the user historically scored lower are weighted higher, targeting weaknesses.
- Filters (difficulty → company) relax gracefully so a question is always returned.

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "question": {
      "id": "cm7q111111111",
      "title": "Two Sum",
      "difficulty": "easy",
      "topic": "Arrays & Hashing",
      "functionName": "twoSum",
      "description": "...",
      "examples": [],
      "constraints": [],
      "testCases": [],
      "starterCode": { "javascript": "...", "python": "..." }
    }
  }
}
```

---

## 📊 Feedback Endpoints

### Get Structured Feedback for Interview

Returns the persisted AI evaluation for a completed interview.

- **Method**: `GET`
- **URL**: `/api/interviews/:id/feedback`
- **Authentication**: **Required** (`Bearer <token>`)

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "feedback": {
      "id": "cm7fb111111111",
      "interviewSessionId": "cm7session123456789",
      "score": 87,
      "problemSolving": 88,
      "codeQuality": 85,
      "communication": 90,
      "optimization": 84,
      "recommendation": "Hire",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "recommendations": ["..."],
      "summary": "..."
    }
  }
}
```

#### Possible Errors
- `404 Not Found`: Session not found.

---

## 💬 Raw Message Management Endpoint

### Save Raw Message (Manual)

Saves a message directly to an active interview session.

- **Method**: `POST`
- **URL**: `/api/interviews/:id/messages`
- **Authentication**: **Required** (`Bearer <token>`)

> **Security note:** clients may only write `"user"` or `"assistant"` roles. `"system"` messages and metadata (scores) are server-owned and any client-supplied `metadata` is ignored — this prevents score forgery.

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | `string` | **Yes** | Must be `"user"` or `"assistant"`. |
| `content` | `string` | **Yes** | Message text. |

```json
{
  "role": "user",
  "content": "Can you provide a quick hint on space complexity?"
}
```

#### Successful Response (`201 Created`)
```json
{
  "status": "success",
  "data": {
    "message": {
      "id": "cm7msg555555555",
      "interviewSessionId": "cm7session123456789",
      "role": "user",
      "content": "Can you provide a quick hint on space complexity?",
      "metadata": null,
      "createdAt": "2026-07-31T13:53:00.000Z",
      "updatedAt": "2026-07-31T13:53:00.000Z"
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Invalid role (`"system"` is rejected) or session is completed.
- `404 Not Found`: Session not found.

---

## ⚡ Real-Time WebSockets Specification

The backend exposes a Socket.IO server for real-time interview interactions.

### Connection Handshake
- **URL**: `ws://localhost:5000` (or `wss://...`)
- **Auth**: Pass JWT in `auth.token`.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN"
  }
});
```

---

### Client Emitted Events

#### 1. `join_session`
Joins the socket room for a specific interview session.

```javascript
socket.emit("join_session", { sessionId: "cm7session123456789" });
```

#### 2. `send_message`
Sends a candidate message over WebSockets. The server persists the message, prompts the AI coach, and broadcasts the user message and AI response back to the session room.

```javascript
socket.emit("send_message", {
  sessionId: "cm7session123456789",
  message: "I recommend using a token bucket algorithm."
});
```

---

### Server Emitted Events

#### 1. `joined_session`
Emitted to the client upon successfully joining the session room.

```json
{
  "sessionId": "cm7session123456789"
}
```

#### 2. `receive_message`
Broadcast to all clients in the session room when a user message is saved.

```json
{
  "id": "cm7msg222222222",
  "sessionId": "cm7session123456789",
  "role": "user",
  "content": "I recommend using a token bucket algorithm.",
  "createdAt": "2026-07-31T13:54:00.000Z"
}
```

#### 3. `ai_response`
Broadcast to all clients in the session room with the candidate message, assistant message, and AI score/metadata object.

```json
{
  "userMessage": {
    "id": "cm7msg222222222",
    "interviewSessionId": "cm7session123456789",
    "role": "user",
    "content": "I recommend using a token bucket algorithm."
  },
  "assistantMessage": {
    "id": "cm7msg333333333",
    "interviewSessionId": "cm7session123456789",
    "role": "assistant",
    "content": "Token bucket is very effective. How would you handle burst traffic under high concurrency?",
    "metadata": {
      "type": "feedback",
      "score": 80
    }
  },
  "aiResponse": {
    "type": "feedback",
    "message": "Token bucket is very effective. How would you handle burst traffic under high concurrency?",
    "score": 80
  }
}
```

#### 4. `socket_error`
Emitted directly to the requesting client when an error occurs during socket handling.

```json
{
  "message": "This interview session is no longer active."
}
```

---

## 💻 Frontend Integration Example (JavaScript / React)

### REST API Integration Example
```javascript
const BASE_URL = "http://localhost:5000/api";

// Helper for authenticated API calls
async function apiFetch(endpoint, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

// Example usage:
async function runInterviewFlow() {
  // 1. Register candidate
  const auth = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: "candidate@example.com",
      password: "password123",
      name: "Alex"
    })
  });
  const token = auth.data.token;

  // 2. Start Interview Session
  const session = await apiFetch("/interviews", {
    method: "POST",
    body: JSON.stringify({ title: "Fullstack Technical Interview" })
  }, token);

  console.log("Opening Question:", session.data.openingMessage.content);

  // 3. Send Answer
  const chat = await apiFetch(`/interviews/${session.data.session.id}/chat`, {
    method: "POST",
    body: JSON.stringify({ message: "I would structure the frontend using React and Vite." })
  }, token);

  console.log("AI Feedback:", chat.data.aiResponse);
}
```

---

This completes the API documentation for the **MockGen AI Interview Simulator** backend.
