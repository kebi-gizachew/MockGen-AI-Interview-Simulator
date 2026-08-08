# MockGen AI Interview Simulator — Backend

Production-ready Express 5 backend with JWT authentication, interview session management, AI-powered mock interviews, and real-time chat via Socket.io.

## Architecture

```
src/
├── app.js                  # Express app assembly
├── server.js               # HTTP + Socket.io bootstrap
├── config/                 # Environment & database
├── constants/              # Shared enums & constants
├── controllers/            # HTTP request handlers (thin)
├── middlewares/            # Auth, errors, 404
├── routes/                 # Route definitions
│   ├── index.js            # Central /api router
│   ├── auth.routes.js
│   ├── interview.routes.js
│   └── aiInterview.routes.js
├── services/               # Business logic
│   ├── auth.service.js
│   ├── interview.service.js
│   ├── aiInterview.service.js
│   ├── message.service.js
│   ├── codeSubmission.service.js
│   └── ai/                 # AI provider abstraction
│       ├── ai.service.js
│       └── providers/
├── sockets/                # Real-time chat
└── utils/                  # Helpers (HttpError, asyncHandler, validate)
```

**Layered flow:** `routes → controllers → services → Prisma`

## Quick Start

```bash
cd Backend
cp .env.example .env        # Edit DATABASE_URL and JWT_SECRET
npm install
npm run prisma:migrate      # Create database tables
npm run dev                 # Start on http://localhost:5000
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | HTTP server port |
| `NODE_ENV` | No | `development` | Environment |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `AI_PROVIDER` | No | `gemini` | AI provider: `gemini` (default) or `mock` |
| `GEMINI_API_KEY` | No | — | If empty, mock AI provider is used |
| `GEMINI_MODEL` | No | `gemini-3.6-flash` | Gemini model name |

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Server & database health check |

### Authentication

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| `POST` | `/api/auth/register` | No | `{ email, password, name? }` | Create account, returns JWT |
| `POST` | `/api/auth/login` | No | `{ email, password }` | Login, returns JWT |
| `GET` | `/api/auth/me` | Yes | — | Get current user profile |

### Interview Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/interviews` | Yes | Start new AI interview (creates session + opening question) |
| `GET` | `/api/interviews` | Yes | List sessions (`?status=active\|completed`, `?page`, `?limit`) |
| `GET` | `/api/interviews/:id` | Yes | Get session with full message history |
| `PATCH` | `/api/interviews/:id` | Yes | Update session title |
| `DELETE` | `/api/interviews/:id` | Yes | Delete session (cascade) |

### AI Interview

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| `POST` | `/api/interviews/:id/chat` | Yes | `{ message }` | Send candidate message, get AI response |
| `POST` | `/api/interviews/:id/end` | Yes | — | End interview, get AI summary & score |

### Messages & Code

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/interviews/:id/messages` | Yes | Manually save a message |
| `GET` | `/api/interviews/:id/code` | Yes | List code submissions |
| `POST` | `/api/interviews/:id/code` | Yes | Submit code snippet |
| `DELETE` | `/api/interviews/:id/code/:submissionId` | Yes | Delete code submission |

## Response Format

**Success:**
```json
{ "status": "success", "data": { ... } }
```

**Error:**
```json
{ "status": "error", "message": "Human-readable error message" }
```

## AI Response Shape

AI endpoints return an `aiResponse` object alongside persisted messages:

```json
{
  "type": "question | feedback | summary",
  "message": "AI text",
  "score": 0
}
```

- `question` — follow-up interview question (score always 0)
- `feedback` — evaluation of candidate answer (score 0–100)
- `summary` — final debrief when interview ends (score 0–100)

## Socket.io (Real-time Chat)

Connect with auth token: `io({ auth: { token: "<jwt>" } })`

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join_session` | Client → Server | `{ sessionId }` | Join session room |
| `joined_session` | Server → Client | `{ sessionId }` | Confirmation |
| `send_message` | Client → Server | `{ sessionId, message }` | Send message & get AI reply |
| `receive_message` | Server → Client | Message object | User message broadcast |
| `ai_response` | Server → Client | `{ userMessage, assistantMessage, aiResponse }` | AI reply |
| `socket_error` | Server → Client | `{ message }` | Error notification |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start production server |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
