# Cogniqs — GenAI Low-Code Workflow Platform

**Cogniqs** is a visual, drag-and-drop workflow automation platform purpose-built for GenAI applications — like n8n, Flowise, and UnifyApps, but focused on LLMs, AI agents, and RAG pipelines.

Built from scratch with lessons from production no-code tools, featuring a modular architecture, unified LLM service layer, and a distinct warm indigo/amber design system.

## Features

- **Visual Workflow Editor** — React Flow canvas with typed AI sub-node connections
- **GenAI Nodes** — OpenAI, Anthropic, Gemini, Ollama, Groq, Azure, Mistral, DeepSeek
- **AI Agents** — Tool calling with HTTP tools and memory buffers
- **RAG Pipeline** — Document ingest + Document Q&A with ChromaDB
- **AutoML / AutoGluon** — Dataset management, model training (classification, regression, time-series), inference, deployment, and a trained-model registry with public predict APIs
- **ML Analysis** — EDA reports, preprocessing, clustering, anomaly detection, forecasting, model evaluation
- **Logic & Data** — IF branching, Code, Set, HTTP Request
- **Execution Engine** — Topological DAG executor with expression support
- **Auth & Projects** — JWT authentication, encrypted credentials
- **Distinct UI** — Warm cream/indigo theme (not dark-cyan like typical tools)

## Node Types

| Category | Nodes |
|----------|-------|
| Triggers | Manual, Webhook, Chat, Schedule |
| Chat Models | OpenAI, Anthropic, Gemini, Ollama, Groq |
| AI Agents | AI Agent |
| AI Chains | Basic LLM Chain |
| RAG | Document Ingest, Document Q&A |
| Memory | Memory Buffer |
| Tools | HTTP Tool |
| Logic | IF, Code |
| Data | Set |
| Integrations | HTTP Request |
| ML Data | Dataset Config |
| ML Training | Model Training (AutoGluon), Model Inference, Model Deployment |
| ML Analysis | EDA Report, Data Preprocessing, Clustering, Anomaly Detection, Time Series Forecast, Model Evaluation |

### AutoGluon / AutoML

The ML stack uses [AutoGluon](https://auto.gluon.ai/) and is **lazy-installed on first use** (or install explicitly with `pip install -e ".[ml]"`), so the core app stays lightweight. Workflow:

1. Upload tabular data on the **Datasets** page (CSV, Parquet, Excel, JSON).
2. Add a **Dataset Config** node, pick the dataset + target column.
3. Connect a **Model Training** node (auto problem-type detection, presets, hyperparameters).
4. Trained models appear on the **Models** page — test predictions, rotate public API keys, download artifacts.
5. Optionally add a **Model Deployment** node to expose `POST /api/trained-models/{id}/predict/public`.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — demo login: `demo@cogniqs.dev` / `demo1234`

### Run Tests

```bash
cd backend
pytest
```

### Docker

```bash
docker compose up --build
```

## Architecture

```
cogniqs/
├── backend/
│   ├── app/
│   │   ├── api/           # REST endpoints
│   │   ├── core/          # Auth, encryption, errors
│   │   ├── engine/        # Node registry, expressions, YAML config
│   │   ├── executions/    # DAG workflow executor
│   │   ├── models/        # SQLAlchemy ORM
│   │   ├── nodes/         # Node implementations
│   │   ├── services/      # LLM, vector store, memory
│   │   └── schemas/       # Pydantic models
│   └── tests/
└── frontend/
    └── src/
        ├── components/workflow/  # Modular editor components
        ├── pages/
        └── api/
```

## Environment Variables

```env
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite+aiosqlite:///./cogniqs.db
```

## License

Private — All rights reserved.
