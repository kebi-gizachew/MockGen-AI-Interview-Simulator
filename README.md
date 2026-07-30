# MockGen-AI-Interview-Simulator

MockGen AI is an intelligent, real-time interview simulation platform that helps users master technical interviews through AI-driven practice, coding challenges, and personalized feedback.

Built to replicate the experience of real FAANG-level interviews, MockGen AI generates dynamic interview questions, evaluates user responses, executes code in a secure environment, and provides structured, human-like feedback — all in real time.

## What it does

- Generates adaptive interview questions based on user performance
- Conducts real-time mock interviews with an AI interviewer
- Allows users to write and execute code live during interviews
- Provides instant AI feedback on correctness, efficiency, and clarity
- Tracks progress to identify strengths and weak areas over time

## Project Structure

```
MockGen-AI-Interview-Simulator/
├── Backend/          # Express 5 + Prisma + Socket.io API
│   └── README.md     # Full API documentation
└── Frontend/         # (coming soon)
```

## Backend Quick Start

```bash
cd Backend
cp .env.example .env        # Set DATABASE_URL and JWT_SECRET
npm install
npm run prisma:migrate      # Create database tables
npm run dev                 # http://localhost:5000
```

See [Backend/README.md](Backend/README.md) for the complete API reference, Socket.io events, and architecture overview.

## Goal

To bridge the gap between preparation and real interview performance by simulating real-world technical interviews at scale, powered by AI.
