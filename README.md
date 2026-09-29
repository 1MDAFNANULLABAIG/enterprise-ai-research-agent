# Enterprise AI Research & Document Agent

[![CI/CD Pipeline](https://github.com/enterprise-ai/research-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/enterprise-ai/research-agent)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![VectorDB](https://img.shields.io/badge/VectorDB-Qdrant%20%7C%20In--Memory-FF4081.svg)](https://qdrant.tech/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **"An enterprise-grade AI research platform that combines Retrieval-Augmented Generation (RAG), hybrid vector search, LLMs, and autonomous tool-using agents to transform documents into reliable, cited insights."**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [RAG Pipeline & Retrieval Strategy](#5-rag-pipeline--retrieval-strategy)
6. [AI Agent Architecture](#6-ai-agent-architecture)
7. [Database Architecture & Multi-Tenancy](#7-database-architecture--multi-tenancy)
8. [Local Development Setup](#8-local-development-setup)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Docker & Container Setup](#10-docker--container-setup)
11. [Automated Testing & Benchmarks](#11-automated-testing--benchmarks)
12. [Production Deployment (Render, Vercel, AWS)](#12-production-deployment-render-vercel-aws)
13. [API Documentation](#13-api-documentation)
14. [Screenshots & UI Walkthrough](#14-screenshots--ui-walkthrough)
15. [Live Demo & Verification Guide](#15-live-demo--verification-guide)

---

## 1. Project Overview

The **Enterprise AI Research & Document Agent** is a full-stack, production-quality artificial intelligence platform built for enterprise document intelligence, contract analysis, financial reporting, and cross-document comparative research.

Unlike generic chatbot wrappers, this system implements:
- **Verifiable RAG**: Direct citation grounding anchored to specific pages and chunk IDs.
- **Strict Hallucination Defenses**: Calibrated similarity thresholds that trigger explicit refusals when evidence is insufficient.
- **Multi-Tenant Security**: Tenant payload isolation across database and vector indexes.
- **Autonomous Multi-Step Agent**: A ReAct-style agent with AST-safe calculation, CSV telemetry, and report generation tools.
- **Production Observability**: Request-level tracing, latency metrics, and an empirical evaluation suite.

---

## 2. Key Features

- **Multi-Format Ingestion**: Supports `.pdf` (with page-level tracking), `.docx`, `.txt`, and tabular `.csv` files up to 50MB.
- **Verifiable Citations**: Every factual claim features an interactive citation badge (`[Source 1, Page 2]`). Clicking opens a slide-over modal displaying the exact matched text and confidence score.
- **Zero-Hallucination Safe Fallback**: When similarity falls below threshold (default: 0.55), the model returns: *"Insufficient information found in the available documents."*
- **Autonomous Research Agent**: Breaks complex research inquiries into multi-step execution plans, querying vectors, analyzing spreadsheets, computing financial margins, and drafting structured executive memos.
- **Natural Language CSV Analytics**: Ingests spreadsheets into Pandas dataframes to calculate totals, averages, anomaly detection, and quarterly trends without LLM hallucinations.
- **Multi-Tenant Role-Based Access Control (RBAC)**: Secure JWT authentication with user and admin permission tiers.
- **Real-Time Token Streaming**: Server-Sent Events (SSE) streaming with live progress stages (*Retrieving -> Reranking -> Generating*).
- **RAG Evaluation Suite**: Automated benchmarks calculating Retrieval Precision, Recall, Faithfulness, and Citation Accuracy.

---

## 3. System Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER (React 18 + TypeScript)                            |
|   /dashboard      /documents (PDF/DOCX/CSV)     /chat (SSE Stream)     /research (Agent Mode)   /admin  |
+----------------------------------------------------+----------------------------------------------------+
                                                     | HTTPS / SSE Streaming (Token & Stage Events)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                      API & SECURITY GATEWAY (FastAPI)                                   |
|   JWT Authentication  *  RBAC (Admin/User)  *  Observability Timing  *  Prompt Injection Guardrails   |
+--------------------------+---------------------------------+--------------------------------------------+
                           |                                 |
              [Document Ingestion Pipeline]          [RAG Retrieval & Agent Pipeline]
                           v                                 v
+--------------------------------------------+   +--------------------------------------------------------+
| 1. File Type & Size Validation (PDF/CSV)   |   | 1. Query Preprocessing & Injection Inspection          |
| 2. Recursive Semantic Chunking (600w/100o) |   | 2. Dense Semantic Vector Generation                    |
| 3. Metadata Injection (user_id/page/chunk) |   | 3. Multi-Tenant Vector Search (Qdrant / Memory Store)  |
| 4. Dense Embeddings (384-dim FastEmbed)    |   | 4. Hybrid BM25 Lexical Reranker (Top-K)                |
| 5. Isolated Vector Upsert (Payload Filter) |   | 5. Context Anchoring & Prompt Assembly                 |
+---------------------+----------------------+   | 6. LLM Invocation (Gemini / OpenAI / Claude / Fallback)|
                      |                          | 7. Strict Citation Extraction [Source X, Page Y]       |
                      v                          +----------------------------+---------------------------+
+--------------------------------------------+                                |
|             PERSISTENCE TIER               |                                v
|  PostgreSQL / SQLite  *  Redis Cluster     |<-------------------------------+
|  Users, Docs, Chunks, Messages, Audit Logs |
+--------------------------------------------+
```

---

## 4. Tech Stack

| Layer | Technologies | Role / Rationale |
|---|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Axios, Vite | Modern, accessible, responsive single-page enterprise dashboard. |
| **Backend API** | FastAPI, Python 3.11, Pydantic v2, Uvicorn | High-performance asynchronous REST and SSE streaming endpoints. |
| **Relational Database** | PostgreSQL 16 / SQLite (via SQLAlchemy 2.0 & Alembic) | Multi-tenant schema with foreign key integrity and audit logs. |
| **Vector Database** | Qdrant Cloud / In-Memory Vector Store | Dense vector search with multi-tenant payload filtering. |
| **LLM & Embeddings** | Google Gemini (2.5 Flash), OpenAI (GPT-4o), Anthropic Claude, Local 384d | Pluggable multi-provider LLM and zero-cost local embedding engine. |
| **Cache & Task Queue** | Redis 7, Celery | Session caching, rate limiting, and asynchronous background ingestion. |
| **Security & Guardrails** | PyJWT, Passlib (bcrypt), AST Safety Parser, Regex Shield | Token authentication, secure hashing, and prompt injection defense. |
| **DevOps & Containers** | Docker, Docker Compose, Nginx, GitHub Actions | Containerization, reverse proxying, and automated CI pipelines. |

---

## 5. RAG Pipeline & Retrieval Strategy

```
User Query
    │
    ▼
[Prompt Injection & Safety Filter]
    │
    ▼
[Query Vector Generation (384-dim)]
    │
    ▼
[Multi-Tenant Vector Search] ──▶ Qdrant / Local Index (Filter: user_id == tenant_id)
    │
    ▼
[Top-2K Oversampled Candidate Chunks]
    │
    ▼
[Hybrid Reranker] ──▶ 65% Dense Cosine Similarity + 35% Lexical BM25 Score
    │
    ▼
[Similarity Threshold Filter (>= 0.55)]
    │
    ├── (Score < 0.55) ──▶ Standard Refusal: "Insufficient information found."
    │
    └── (Score >= 0.55)
            │
            ▼
     [Context Injection with Strict Grounding Headers]
            │
            ▼
     [LLM Streaming Synthesis with Citation Tags [Source N, Page P]]
            │
            ▼
     [Client SSE Rendering & Interactive Citation Badges]
```

### Retrieval Hyperparameters
- **Chunk Size**: 600 characters with 100 character semantic overlap.
- **Top-K Retrieval**: Configurable from 1 to 15 (default: 5).
- **Similarity Cutoff**: Configurable from 0.30 to 0.90 (default: 0.55).
- **Reranker Weights**: 65% Dense Vector Cosine Similarity + 35% Lexical BM25 Score.

---

## 6. AI Agent Architecture

The **Autonomous Research Agent** uses a structured reasoning cycle to solve complex multi-step queries:

```
User Research Goal
        │
        ▼
[Dynamic Planner Engine]
        │
        ▼
   Execution Loop:
   ├── 1. Analyze Objective & Select Tool
   ├── 2. Execute Approved Tool with Isolated Arguments
   ├── 3. Observe Results & Track Reasoning Step
   └── 4. Continue until Goal Met or Max Steps Reached
        │
        ▼
[Synthesis Engine] ──▶ Generates Executive Briefing with Citations & Metrics Matrix
```

### Approved Agent Tools
1. **Document Search (`document_search`)**: Multi-tenant semantic query over indexed documents.
2. **Document Retrieval (`document_retrieval`)**: Exact chunk and surrounding page retrieval.
3. **AST Calculator (`calculator`)**: Sandboxed mathematical evaluation (growth rates, margins, percentage deltas) without arbitrary code execution.
4. **CSV Analytics (`csv_analysis`)**: Pandas-powered statistical profiling, grouping, and trend analysis.
5. **Web Search (`web_search`)**: Authoritative regulatory and industry references.
6. **Report Generator (`report_generator`)**: Formats findings into executive intelligence memos.

---

## 7. Database Architecture & Multi-Tenancy

The relational schema ensures strict multi-tenant isolation. Every document, chunk, conversation, and audit log is indexed by `user_id`.

```
                  +-------------------+
                  |       users       |
                  |-------------------|
                  | id (UUID / PK)    |
                  | email (Unique)    |
                  | hashed_password   |
                  | role (admin/user) |
                  | is_active (bool)  |
                  +---------+---------+
                            |
         +------------------+------------------+
         | 1:N                                 | 1:N
         v                                     v
+-------------------+                 +-------------------+
|     documents     |                 |   conversations   |
|-------------------|                 |-------------------|
| id (UUID / PK)    |                 | id (UUID / PK)    |
| user_id (FK)      |                 | user_id (FK)      |
| filename (str)    |                 | title (str)       |
| file_type (str)   |                 | created_at (time) |
| file_size (int)   |                 +---------+---------+
| status (str)      |                           |
| chunk_count (int) |                           | 1:N
+---------+---------+                           v
          |                            +-------------------+
          | 1:N                        |     messages      |
          v                            |-------------------|
+-------------------+                  | id (UUID / PK)    |
|  document_chunks  |                  | conversation_id   |
|-------------------|                  | role (user/ai)    |
| id (UUID / PK)    |                  | content (text)    |
| document_id (FK)  |                  | citations (JSON)  |
| user_id (FK)      |                  | latency_ms (float)|
| chunk_index (int) |                  +-------------------+
| page_number (int) |
| content (text)    |
+-------------------+
```

---

## 8. Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Seed demo documents and accounts
python seed_demo.py

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be accessible at: `http://127.0.0.1:8000` (Swagger docs: `/docs`).

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be accessible at: `http://localhost:3000`.

---

## 9. Environment Variables Reference

| Variable | Required in Prod | Default Value | Description |
|---|---|---|---|
| `ENVIRONMENT` | Yes | `development` | Runtime environment (`development`, `production`). |
| `DEBUG` | Yes | `False` | Enable/disable FastAPI debug mode. |
| `PORT` | Yes (Render) | `8000` | Port for the backend server to bind. |
| `HOST` | Yes | `0.0.0.0` | Host IP address binding. |
| `SECRET_KEY` | **CRITICAL** | *(safe placeholder)* | 64-char hex key used to sign JWT tokens. |
| `DATABASE_URL` | Yes | `sqlite:///./enterprise_agent.db` | PostgreSQL connection string in production. |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis instance for task queue and response caching. |
| `USE_REDIS_CACHE` | No | `False` | Toggle Redis caching for repeated semantic queries. |
| `VECTOR_DB_TYPE` | Yes | `inmemory` | Vector storage mode (`inmemory` or `qdrant`). |
| `QDRANT_URL` | If Qdrant | `""` | Qdrant Cloud or local cluster URL. |
| `QDRANT_API_KEY` | If Qdrant Cloud | `""` | Qdrant Cloud cluster API key. |
| `DEFAULT_LLM_PROVIDER` | Yes | `gemini` | Primary LLM provider (`gemini`, `openai`, `anthropic`, `fallback`). |
| `GEMINI_API_KEY` | If Gemini | `""` | Google Gemini API key. |
| `OPENAI_API_KEY` | If OpenAI | `""` | OpenAI API key. |
| `ANTHROPIC_API_KEY` | If Anthropic | `""` | Anthropic Claude API key. |
| `EMBEDDING_PROVIDER` | Yes | `local` | Embedding engine (`local` 384d, `gemini`, `openai`). |
| `BACKEND_CORS_ORIGINS` | Yes | `*` | Allowed CORS origins (comma-separated list). |
| `VITE_API_URL` | Yes (Frontend) | `http://localhost:8000/api/v1` | Backend URL used by frontend API clients. |

---

## 10. Docker & Container Setup

Run the complete multi-service stack with a single command:

```bash
docker-compose up --build -d
```

### Services Started:
- **`enterprise_ai_postgres`**: PostgreSQL 16 database (`port 5432`).
- **`enterprise_ai_redis`**: Redis 7 cache and Celery broker (`port 6379`).
- **`enterprise_ai_qdrant`**: Qdrant vector database (`port 6333`).
- **`enterprise_ai_backend`**: FastAPI application (`port 8000`).
- **`enterprise_ai_worker`**: Celery asynchronous background worker.
- **`enterprise_ai_frontend`**: Nginx serving production React SPA (`port 3000`).

---

## 11. Automated Testing & Benchmarks

Run the automated test suite:
```bash
cd backend
pytest -v
```

### Benchmark Evaluation Results:
| Metric | Measured Score | Target Baseline | Description |
|---|---|---|---|
| **Retrieval Precision** | **68.0%** | > 60.0% | Proportion of retrieved chunks directly relevant to query |
| **Retrieval Recall** | **100.0%** | > 85.0% | Proportion of essential ground-truth facts retrieved |
| **Answer Faithfulness** | **66.4%** | > 65.0% | Factual grounding in retrieved source evidence |
| **Citation Accuracy** | **90.0%** | > 80.0% | Alignment of citations to exact source passages |
| **Average Latency** | **66.2 ms** | < 200 ms | Hybrid vector retrieval & reranking response time |

---

## 12. Production Deployment (Render, Vercel, AWS)

### Option A: Render Deployment (Recommended for Backend)

1. Fork or push this repository to GitHub.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository. Render reads [`render.yaml`](render.yaml) automatically:
   - Provisions a managed PostgreSQL database.
   - Deploys the Python FastAPI Web Service.
   - Configures automatic health checks on `/api/v1/health`.
5. Set your secret environment variables in the Render Dashboard:
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`
   - `BACKEND_CORS_ORIGINS` (e.g. `https://your-frontend.vercel.app`)

### Option B: Vercel Deployment (Recommended for Frontend)

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**, and select your GitHub repository.
3. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://enterprise-ai-backend.onrender.com/api/v1`)
5. Click **Deploy**. Vercel uses [`frontend/vercel.json`](frontend/vercel.json) to handle single-page routing rewrites.

### Option C: AWS Deployment (ECS Fargate + S3)
Refer to the complete Terraform modules in [`deployment/aws/`](deployment/aws/) for production AWS infrastructure including VPC, ALB, ECS Fargate, RDS PostgreSQL, and CloudFront.

---

## 13. API Documentation

Comprehensive interactive Swagger documentation is available at `/docs` and Redoc at `/redoc`.

### Key Endpoints:
- `POST /api/v1/auth/register`: Create a new user account.
- `POST /api/v1/auth/login`: Authenticate and receive a JWT Bearer token.
- `GET /api/v1/auth/me`: Get current authenticated user details.
- `GET /api/v1/documents`: List uploaded documents with parsing and chunking status.
- `POST /api/v1/documents/upload`: Upload `.pdf`, `.docx`, `.txt`, or `.csv` files.
- `POST /api/v1/chat/message`: Non-streaming Q&A with hybrid RAG and citation extraction.
- `POST /api/v1/chat/stream`: SSE token streaming endpoint with live pipeline stage events.
- `POST /api/v1/research/run`: Execute an autonomous multi-step research agent task.
- `POST /api/v1/csv/analyze`: Execute structured Pandas statistical operations on CSV documents.
- `GET /api/v1/health`: Liveness health check endpoint.
- `GET /api/v1/ready`: Readiness check confirming database and vector store connectivity.

---

## 14. Screenshots & UI Walkthrough

```
+---------------------------------------------------------------------------------+
| [Enterprise AI Research]  Documents  Chat  Research  Analytics  Admin  [Profile] |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  DOCUMENT REPOSITORY                CHAT & CITATION ENGINE                      |
|  +------------------------------+   +-----------------------------------------+ |
|  | [PDF] Q4_Financial_Report    |   | User: What were the Q4 revenue drivers? | |
|  | Status: Indexed (24 chunks)  |   |                                         | |
|  | [DOCX] SOC2_Security_Policy  |   | AI: Cloud revenue increased 34% driven  | |
|  | Status: Indexed (18 chunks)  |   | by enterprise expansions [Source 1, P3].| |
|  | [CSV] Sales_Telemetry_2025   |   |                                         | |
|  | Status: Indexed (100 rows)   |   | [Source 1, Page 3: "Enterprise Cloud..."]| |
|  +------------------------------+   +-----------------------------------------+ |
|                                                                                 |
|  AUTONOMOUS RESEARCH AGENT          CSV TABULAR ANALYTICS                       |
|  +------------------------------+   +-----------------------------------------+ |
|  | Objective: Compare margins   |   | Total Rows: 1,000 | Columns: 8          | |
|  | [Step 1] Vector Search: Done |   | Top Category: Enterprise Subscriptions  | |
|  | [Step 2] Calculator: +24.8%  |   | Mean Deal Size: $42,500                 | |
|  | [Step 3] Executive Report    |   | Anomalies Detected: 2 (Flagged)         | |
|  +------------------------------+   +-----------------------------------------+ |
+---------------------------------------------------------------------------------+
```

- **Dashboard**: High-level platform health, ingested document summary, and recent activity.
- **Document Management**: Drag-and-drop file uploader with chunking progress indicators.
- **Chat & Citations**: Real-time SSE streaming with interactive citation badges and confidence metrics.
- **Research Agent**: Live execution stepper showing dynamic agent thought steps and tool invocations.
- **Evaluation Dashboard**: Visual charts measuring benchmark retrieval precision, recall, and latency.

---

## 15. Live Demo & Verification Guide

### Pre-Configured Demo Accounts
| Role | Email | Password | Access Level |
|---|---|---|---|
| **Enterprise Admin** | `admin@enterprise.ai` | `AdminPass123!` | System config, user management, and evaluation benchmarks. |
| **Senior AI Analyst**| `analyst@enterprise.ai` | `AnalystPass123!` | Document ingestion, chat, and research agent workflows. |

### Verification Steps:
1. Log in using `admin@enterprise.ai` (or click the demo credentials on the login screen).
2. Go to **Documents** to view pre-indexed enterprise files (`Q4_Financial_Report.pdf`, `SOC2_Security_Audit.docx`, `Enterprise_Architecture.txt`, `Quarterly_Sales_Telemetry.csv`).
3. Open **Chat** and ask: *"What was the total enterprise cloud revenue in Q4 and what was the growth rate?"*
4. Verify that:
   - Tokens stream with live stage feedback.
   - Citation badges (`[Source 1, Page 3]`) appear in the response.
   - Clicking a citation opens the exact source excerpt.
5. Open **Research** and enter: *"Analyze the security posture and compute compliance score deltas across documents."*
6. Observe the autonomous agent formulate a plan, call search and calculator tools, and deliver an executive briefing.
7. Open **Admin / Evaluation** to run the live RAG evaluation suite and view real-time accuracy metrics.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
