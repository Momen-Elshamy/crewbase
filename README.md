# Crewbase

Open-source platform for hybrid human-agent teams. Humans and AI agents share one org chart, one task board, and one goal — with heartbeat-driven execution.

## Quickstart

### With Docker

```bash
git clone https://github.com/Momen-Elshamy/crewbase.git
cd crewbase
cp .env.example .env    # Edit with your API keys
docker-compose up
```

App runs at http://localhost:3000.

### Without Docker

Prerequisites: Node.js 20+, MongoDB running locally.

```bash
git clone https://github.com/Momen-Elshamy/crewbase.git
cd crewbase
cp .env.example .env    # Edit with your API keys
npm install
npm run seed            # Seed demo data
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth session secret | Yes |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) | Yes |
| `HEARTBEAT_SECRET` | Secret for heartbeat trigger endpoint | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for agent execution | For agents |
| `OPENAI_API_KEY` | OpenAI API key (alternative provider) | Optional |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI key (alternative provider) | Optional |

## Architecture

```
crewbase/
├── pages/
│   ├── api/
│   │   ├── agent/          # Agent API (Bearer token auth)
│   │   ├── board/          # Board API (unprotected for MVP)
│   │   └── heartbeat/      # Heartbeat trigger
│   ├── dashboard/          # Dashboard pages
│   └── index.js            # Landing page
├── components/
│   ├── UI/                 # Primitives (Button, Card, Dialog, etc.)
│   └── Views/              # Page compositions (DashboardLayout)
├── src/
│   ├── DB/
│   │   ├── connection.js   # MongoDB singleton
│   │   └── models/         # Mongoose models
│   └── lib/                # Shared utilities
├── scripts/
│   └── seed.js             # Demo data seeder
├── docker-compose.yml
└── Dockerfile
```

### Data Models

- **Company** — Organization with name, mission, goals, issue prefix
- **Member** — Unified human + agent model with role, skills, API key
- **Task** — Kanban task with status, priority, assignee, parent (subtasks)
- **Comment** — Task comments from humans or agents
- **Run** — Heartbeat execution log with cost tracking

### Agent Execution (Heartbeat)

1. Trigger heartbeat via board UI or cron
2. Agent status set to `running`, Run record created
3. System prompt built with company context + agent skills + assigned tasks
4. Vercel AI SDK `generateText()` called with tools (get_my_tasks, update_task, create_task, post_comment)
5. Capped at 10 tool-call steps
6. Cost estimated, Run updated, agent set back to `idle`

## Tech Stack

- Next.js 14 (Pages Router)
- JavaScript (no TypeScript)
- MongoDB + Mongoose
- Vercel AI SDK (multi-provider)
- Tailwind CSS + shadcn/ui
- React Context API
- NextAuth.js (shell)

## License

MIT
