# SSME Failure Detection System Dashboard

A production-grade frontend dashboard for visualizing rocket engine (SSME) failure detection and response, built on top of the Prometheux ontology-native data processing platform.

![Dashboard](https://img.shields.io/badge/React-18-blue) ![Backend](https://img.shields.io/badge/FastAPI-Python-green) ![Prometheux](https://img.shields.io/badge/Prometheux-Vadalog-purple)

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   React UI   │────▶│  FastAPI Backend  │────▶│  Prometheux Platform     │
│  (Vite + TS) │     │  /api/digital-twin│     │  (Vadalog engine)        │
│  React Flow  │     │  /api/analytics   │     │  5 data sources:         │
│  Framer Motion│    │  /api/chat        │     │  PostgreSQL, Neo4j,      │
└──────────────┘     └──────────────────┘     │  MariaDB, S3 CSV (x2)   │
                                               └──────────────────────────┘
```

**Backend** — FastAPI (Python) that wraps the `prometheux_chain` SDK, executing Vadalog programs against 5 heterogeneous data sources (PostgreSQL, Neo4j, MariaDB, S3 CSV files) and exposing structured JSON endpoints.

**Frontend** — React + TypeScript + Vite dashboard featuring:
- Interactive component network graph (React Flow) with hierarchical layout
- Failure propagation animations with step-by-step chain visualization
- Single-chain focus mode (isolate Sensor A / B / C propagation paths)
- Minimap + quick navigation (Fit All, Focus Root Causes, Focus Failed Sensors)
- Component search with auto-focus and graph zoom
- AI-powered chat assistant (Claude) with real-time ontology querying
- Hotspot analysis, root cause identification, and team leader notifications

## Prerequisites

- Python 3.9+
- Node.js 18+
- A Prometheux API token
- An Anthropic API key (for the chat assistant)

## Setup

### 1. Environment variables

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Required variables:
- `PMTX_TOKEN` — Prometheux JWT token
- `PMTX_ORG`, `PMTX_USERNAME` — Prometheux account
- `PG_*`, `NEO4J_*`, `MARIADB_*` — Database credentials
- `S3_ACCESS_KEY`, `S3_SECRET_KEY` — S3 bucket access
- `ANTHROPIC_API_KEY` — Claude API key for the chat assistant

### 2. Backend

```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload
```

API docs available at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at http://localhost:5173

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/digital-twin/components` | All 30 engine components with status, team, observability |
| `GET /api/digital-twin/links` | All 29 parent-child component relationships |
| `GET /api/digital-twin/employees` | Unified employee data from PostgreSQL, Neo4j, MariaDB |
| `GET /api/digital-twin/failed-sensors` | Stage 1: Failed sensors and directly affected components |
| `GET /api/digital-twin/propagation` | Stage 2: Recursive failure propagation chains |
| `GET /api/digital-twin/hotspots` | Stage 3: Hotspot convergence analysis |
| `GET /api/digital-twin/root-cause` | Stage 3: Root cause components |
| `GET /api/digital-twin/notifications` | Stage 4: Team leader notifications |
| `GET /api/analytics/degree-centrality` | Graph analytics: degree centrality scores |
| `GET /api/analytics/shortest-paths` | Graph analytics: all-pairs shortest paths |
| `POST /api/chat` | AI chat assistant with tool use (queries ontology in real time) |

## Digital Twin Pipeline

| Stage | Description | Vadalog Concept |
|-------|-------------|-----------------|
| 1 | Detect failed observable sensors | `failed_sensor`, `direct_failure` |
| 2 | Recursive failure propagation through component hierarchy | `failure_chain` (step-by-step tracing) |
| 3 | Hotspot & root cause identification | `hotspot` (mcount), `root_cause` (mmax) |
| 4 | Team leader notification | `notification` (joins root cause → team → employee) |

### Key Findings

- **3 failed sensors**: Temp_Sensor_A, Temp_Sensor_B, Temp_Sensor_C
- **5 root cause components** (all 3 chains converge): HPOTP, LPOTP, LPOTP_Discharge, LOX_Supply_Line, LOX_Tank
- **1 team leader notified**: Laura Grey (MainChainTeam)

## Chat Assistant

The dashboard includes an AI-powered chat assistant (Claude Sonnet 4.6) that can query the Prometheux ontology in real time. It uses Claude's tool use capability — when asked a question, Claude calls the appropriate Digital Twin API endpoints and synthesizes the results into a conversational response.

Example queries:
- "What sensors have failed?"
- "Show me the failure propagation from Sensor A"
- "What is the root cause?"
- "Who should be notified?"

## Connection to Part 1

This dashboard visualizes the Digital Twin built in Part 1 using Vadalog on the Prometheux platform. The backend executes the same Vadalog programs that were developed and verified during Part 1, connecting to the same 5 data sources and producing the same analytical results — now surfaced through an interactive UI with real-time data from the Prometheux API.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Graph | React Flow |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | FastAPI (Python) |
| Data Engine | Prometheux (Vadalog) |
| AI Assistant | Claude Sonnet 4.6 (Anthropic API) |
