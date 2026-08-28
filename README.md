# Agentic CivicFix

> AI-powered civic issue resolution platform — Hackathon Project

## Overview

Citizens report civic problems (potholes, broken streetlights, drainage blockages, water leaks, etc.) with a photo, GPS location, and optional description. An agentic AI workflow processes each complaint through a pipeline of specialized agents backed by Supabase PostgreSQL.

## Agent Pipeline

```
Citizen → Intake Agent → Analysis Agent → Assignment Agent
       → Monitoring Agent → [Escalation Agent] → Closure Agent → Citizen Feedback
```

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 19 + Vite 8 + Tailwind CSS + Motion for React |
| Backend    | Node.js + Express                                   |
| Database   | Supabase PostgreSQL                                 |
| Storage    | Supabase Storage                                    |
| AI         | Google Gemini API                                   |
| Maps       | Google Maps / Places API + Browser Geolocation API  |
| Auth       | Supabase Auth (Google OAuth for citizens)           |

## Project Structure

```
/
├── frontend/          # React + Vite application
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── lib/
│       └── context/
│
├── backend/           # Node.js + Express API
│   └── src/
│       ├── agents/       # One file per agent
│       ├── services/     # Gemini, Maps, Storage, Notifications
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       ├── utils/
│       ├── config/
│       ├── jobs/
│       └── orchestrator/
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- A Supabase project with the required schema applied

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

Backend starts on `http://localhost:3001`. Health check: `GET /api/health`

### Frontend

```bash
cd frontend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

## Environment Variables

See:
- [`backend/.env.example`](backend/.env.example)
- [`frontend/.env.example`](frontend/.env.example)

> **Never** commit `.env` files or hardcode secrets.

## Development Status

Foundation initialized. Features are being built module by module.

| Module            | Status      |
|-------------------|-------------|
| Project structure | ✅ Complete |
| Backend server    | ✅ Complete |
| Frontend scaffold | ✅ Complete |
| Authentication    | 🔜 Next     |
| Complaint intake  | 🔜 Planned  |
| Agent pipeline    | 🔜 Planned  |
| Dashboard UI      | 🔜 Planned  |
