# Prometheux Digital Twin — SSME Failure Detection Dashboard

A production-grade frontend dashboard for visualizing rocket engine (SSME) failure detection and response, built on top of the Prometheux ontology-native data processing platform.

## Architecture

**Backend** — FastAPI (Python) that wraps the `prometheux_chain` SDK, executing Vadalog programs against 5 heterogeneous data sources (PostgreSQL, Neo4j, MariaDB, S3 CSV files) and exposing structured JSON endpoints.

**Frontend** — React + TypeScript + Vite dashboard featuring an interactive component network graph (React Flow), failure propagation animations, hotspot analysis, and team leader notifications.

## Prerequisites

- Python 3.9+
- Node.js 18+
- A Prometheux API token (or use mock mode for local development)

## Setup

### 1. Environment variables

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Set `USE_MOCK=true` in `.env` to use hardcoded data without a Prometheux API connection.

### 2. Backend

```bash
cd backend
python -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
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

## Digital Twin Pipeline

| Stage | Description | Vadalog Concept |
|-------|-------------|-----------------|
| 1 | Detect failed sensors | `failed_sensor`, `direct_failure` |
| 2 | Recursive failure propagation | `failure_chain` (step-by-step) |
| 3 | Hotspot & root cause identification | `hotspot`, `root_cause` (mcount/mmax) |
| 4 | Team leader notification | `notification` (joins root cause → team → employee) |

## Connection to Part 1

This dashboard visualizes the Digital Twin built in Part 1 using Vadalog on the Prometheux platform. The backend executes the same Vadalog programs that were developed and verified during Part 1, connecting to the same 5 data sources and producing the same analytical results — now surfaced through an interactive UI.
