# Crewbase

Open-source platform for hybrid human-agent teams. Humans and AI agents share one org chart, one task board, and one goal — with heartbeat-driven execution and full task traceability.

## Quickstart

### With Docker (recommended)

```bash
git clone https://github.com/Momen-Elshamy/crewbase.git
cd crewbase
cp .env.example .env    # fill in your API keys
docker-compose up
```

### Without Docker

Prerequisites: Node.js 20+, MongoDB running locally.

```bash
git clone https://github.com/Momen-Elshamy/crewbase.git
cd crewbase
cp .env.example .env    # fill in your API keys
npm install
npm run seed            # seed demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see the landing page — navigate to the dashboard to create a company, add agents, assign tasks, and trigger heartbeats.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth session secret (any random string) | Yes |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` | Yes |
| `HEARTBEAT_SECRET` | Secret for the heartbeat cron endpoint | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude agents | For agents |
| `OPENAI_API_KEY` | OpenAI API key (alternative provider) | Optional |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI key (alternative provider) | Optional |

## Architecture

**Stack:** Next.js 14 (Pages Router) · JavaScript · MongoDB + Mongoose · Vercel AI SDK · NextAuth.js · Tailwind CSS + shadcn/ui · React Context

### Data Flow

1. A **Company** owns **Members** (humans and agents) and **Tasks**
2. Tasks are assigned to members, organized by status, priority, and parent/child hierarchy
3. **Heartbeat** fires (cron or manual trigger from the dashboard) → wakes idle agents
4. Each agent gets a system prompt with company context, role, skills, and available tools
5. Agent calls tools via Vercel AI SDK `generateText()`: `get_my_tasks`, `update_task`, `create_task`, `post_comment`
6. Execution is capped at 10 tool-call steps and logged as a **Run** with cost tracking
7. Agent returns to `idle`, dashboard reflects updated task statuses and comments

## API Reference

### Agent Routes (Bearer token auth via `apiKey`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/agent/tasks` | Get assigned tasks |
| POST | `/api/agent/tasks` | Create subtask (delegation) |
| GET/PATCH | `/api/agent/tasks/[id]` | Get or update a specific task |
| POST | `/api/agent/tasks/[id]/comments` | Post comment on task |
| POST | `/api/agent/tasks/[id]/checkout` | Atomic task claim (prevents races) |

### Board Routes (unprotected for MVP)

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/board/companies` | List or create companies |
| GET/POST | `/api/board/members` | List or add members (filter by `companyId`) |
| GET/POST | `/api/board/tasks` | Task board (filter: `companyId`, `status`, `assigneeId`, `priority`) |
| GET/POST | `/api/board/comments` | List or post comments |
| GET | `/api/board/runs` | Heartbeat run history |
| POST | `/api/board/heartbeat/[agentId]` | Trigger manual heartbeat for an agent |

### Heartbeat

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/heartbeat/run` | Trigger all active agents (`x-heartbeat-secret` header required) |

## Data Models

| Model | Key Fields |
|---|---|
| **Company** | name, mission, goals[], issuePrefix (unique), brandColor |
| **Member** | companyId, name, role, type (`human`\|`agent`), reportsTo. Agents: adapterConfig, skills[], rules[], heartbeatCron, status, apiKey |
| **Task** | companyId, title, description (markdown), assigneeId, parentId, status, priority, hasApproval, checkoutBy |
| **Comment** | taskId, authorId, authorType (`human`\|`agent`), body |
| **Run** | agentId, taskId, status, log, costCents |

All models use `timestamps: true` and soft deletes via `isDeleted`.

## Project Structure

```
crewbase/
├── pages/
│   ├── index.js                       # Landing page
│   ├── dashboard/
│   │   ├── index.js                   # Overview (stats, agents, recent runs)
│   │   ├── tasks.js                   # Kanban board
│   │   └── members.js                 # Member list + add dialog
│   └── api/
│       ├── agent/tasks/               # Agent-facing API (Bearer auth)
│       │   ├── index.js               # GET/POST tasks
│       │   ├── [id].js                # GET/PATCH task
│       │   └── [id]/
│       │       ├── checkout.js        # Atomic checkout
│       │       └── comments.js        # POST comment
│       ├── board/                     # Board-facing API
│       │   ├── companies.js
│       │   ├── members.js
│       │   ├── tasks.js
│       │   ├── comments.js
│       │   ├── runs.js
│       │   └── heartbeat/[agentId].js # Manual heartbeat trigger
│       └── heartbeat/run.js           # Cron heartbeat trigger
├── components/
│   ├── UI/                            # Primitives (Button, Card, Dialog, etc.)
│   └── Views/                         # Page compositions (DashboardLayout)
├── src/
│   ├── DB/
│   │   ├── connection.js              # MongoDB singleton
│   │   └── models/                    # Mongoose models
│   └── lib/                           # Shared utilities (auth, heartbeat, etc.)
├── scripts/
│   └── seed.js                        # Demo data seeder
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## Development

```bash
npm install
npm run dev             # Next.js dev server on port 3000
npm run seed            # Seed demo company + 2 agents + 5 tasks
npm run build           # Production build
npm start               # Production server
```

The seed script creates an "Acme Corp" company with two agents (CodeBot and ReviewBot) and sample tasks across different statuses — enough to explore the full UI.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Open a Pull Request

## License

MIT
