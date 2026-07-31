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
| `500` | Internal Server Error | Unexpected server error. |
| `503` | Service Unavailable | Database schema uninitialized or database unavailable. |

---

## 🗄️ Core Data Schemas

### User
```typescript
interface User {
  id: string;        // CUID
  email: string;     // Unique email
  name?: string | null;
  createdAt: string; // ISO 8601 Timestamp
}
```

### InterviewSession
```typescript
type SessionStatus = "active" | "completed";

interface InterviewSession {
  id: string;        // CUID
  userId: string;
  title: string;
  status: SessionStatus;
  startedAt: string; // ISO 8601 Timestamp
  endedAt?: string | null; // ISO 8601 Timestamp
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
    codeSubmissions: number;
  };
  messages?: Message[];
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
| `password` | `string` | **Yes** | Min 8 characters. |
| `name` | `string` | No | User display name. |

```json
{
  "email": "candidate@example.com",
  "password": "securepassword123",
  "name": "Jane Candidate"
}
```

#### Successful Response (`201 Created`)
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
- `400 Bad Request`: Email/password missing or password under 8 characters.
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

### 3. Get Current User Profile

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
      "createdAt": "2026-07-31T13:45:00.000Z"
    }
  }
}
```

#### Possible Errors
- `401 Unauthorized`: Missing, invalid, or expired JWT.

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
| `title` | `string` | No | Title of session (e.g., `"Frontend React Interview"`). Defaults to `"Mock Interview"`. |

```json
{
  "title": "System Design & Node.js Architecture"
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

---

### 2. End Interview & Generate Final Summary

Ends an active interview session, marks status as `completed`, records `endedAt`, and generates a comprehensive performance debrief summary.

- **Method**: `POST`
- **URL**: `/api/interviews/:id/end`
- **Authentication**: **Required** (`Bearer <token>`)

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
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Session is already completed.
- `404 Not Found`: Session not found.

---

## 💻 Code Submission Endpoints

### 1. Submit Code Snippet

Stores code written by candidate during the interview session.

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
  "code": "function rateLimiter(req) {\n  const now = Date.now();\n  return true;\n}",
  "notes": "Initial draft of rate limiter helper function."
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
      "code": "function rateLimiter(req) {\n  const now = Date.now();\n  return true;\n}",
      "notes": "Initial draft of rate limiter helper function.",
      "createdAt": "2026-07-31T13:52:00.000Z",
      "updatedAt": "2026-07-31T13:52:00.000Z"
    }
  }
}
```

#### Possible Errors
- `400 Bad Request`: Language or code missing OR interview session is completed.
- `404 Not Found`: Session not found.

---

### 2. Get All Code Submissions for Session

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

### 3. Delete Code Submission

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

## 💬 Raw Message Management Endpoint

### Save Raw Message (Manual / System)

Saves a message directly to an active interview session.

- **Method**: `POST`
- **URL**: `/api/interviews/:id/messages`
- **Authentication**: **Required** (`Bearer <token>`)

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | `string` | **Yes** | Must be `"user"`, `"assistant"`, or `"system"`. |
| `content` | `string` | **Yes** | Message text. |
| `metadata` | `object` | No | Optional metadata JSON object. |

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
