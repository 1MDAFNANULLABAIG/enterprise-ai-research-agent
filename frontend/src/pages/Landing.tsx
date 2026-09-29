import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Search,
  FileText,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BarChart3,
  Terminal,
  Zap,
  BookOpen
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-enterprise-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-enterprise-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-enterprise-500/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              Enterprise AI Agent
              <span className="text-[10px] bg-enterprise-500/20 text-enterprise-400 px-2 py-0.5 rounded-full font-mono">v1.0</span>
            </span>
            <p className="text-[11px] text-slate-400">Research & Document Intelligence Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-enterprise-600 hover:bg-enterprise-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-md shadow-enterprise-600/20 flex items-center gap-1.5"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-enterprise-500/10 border border-enterprise-500/20 text-enterprise-400 text-xs font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Production AI/ML Engineering Reference Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Enterprise AI Research &{' '}
          <span className="bg-gradient-to-r from-enterprise-400 via-indigo-300 to-enterprise-200 bg-clip-text text-transparent">
            Document Agent
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl font-normal leading-relaxed">
          An enterprise-grade AI research platform that combines{' '}
          <strong className="text-white">RAG</strong>,{' '}
          <strong className="text-white">vector search</strong>,{' '}
          <strong className="text-white">LLMs</strong>, and{' '}
          <strong className="text-white">autonomous tool-using agents</strong> to transform documents into reliable, cited insights.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="bg-enterprise-600 hover:bg-enterprise-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-enterprise-600/25 flex items-center gap-2 transition text-base"
          >
            <span>Explore Demo Environment</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#architecture"
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium px-6 py-3.5 rounded-xl transition text-base"
          >
            View System Architecture
          </a>
        </div>

        {/* Key Metrics Banner */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-xs text-slate-400 uppercase font-mono">Retrieval Latency</span>
            <p className="text-2xl font-bold text-enterprise-400 mt-1">&lt; 70 ms</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Hybrid Vector + BM25</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-xs text-slate-400 uppercase font-mono">Supported Formats</span>
            <p className="text-2xl font-bold text-white mt-1">PDF, DOCX, CSV, TXT</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Multi-Page Semantic Chunking</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-xs text-slate-400 uppercase font-mono">Hallucination Defense</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">100% Grounded</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Strict Clickable Citations</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
            <span className="text-xs text-slate-400 uppercase font-mono">Security Model</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">Multi-Tenant</p>
            <p className="text-[11px] text-slate-500 mt-0.5">JWT & Payload Level Isolation</p>
          </div>
        </div>
      </section>

      {/* Architecture Diagram Section */}
      <section id="architecture" className="py-16 px-6 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight">System Architecture & Pipeline</h2>
            <p className="text-slate-400 text-sm mt-2">
              Modular decoupled micro-tier design separating ingestion, vector indexing, agentic orchestration, and streaming UI.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed shadow-xl">
            <pre className="text-enterprise-400 font-bold mb-2">PLATFORM ARCHITECTURE & PIPELINE DECOMPOSITION:</pre>
            <pre className="text-slate-300">
{`+---------------------------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER (React 18 + TypeScript)                            |
|   /dashboard      /documents (PDF/DOCX/CSV)     /chat (SSE Stream)     /research (Agent Mode)   /admin  |
+----------------------------------------------------+----------------------------------------------------+
                                                     | HTTPS / SSE Streaming
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                      API & SECURITY GATEWAY (FastAPI)                                   |
|   JWT Authentication  *  RBAC (Admin/User)  *  Observability Timing  *  Prompt Injection Guardrails   |
+--------------------------+---------------------------------+--------------------------------------------+
                           |                                 |
              [Document Ingestion Pipeline]          [RAG Retrieval & Agent Pipeline]
                           v                                 v
+--------------------------------------------+   +--------------------------------------------------------+
| 1. File Type & Size Validation (PDF/CSV)   |   | 1. Query Preprocessing & Safety Inspection             |
| 2. Recursive Semantic Chunking (600w/100o) |   | 2. Query Dense Embedding Generation                    |
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
+--------------------------------------------+`}
            </pre>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-enterprise-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-enterprise-500/10 text-enterprise-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-2">Verifiable Source Citations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every response is anchored in document excerpts with clickable citations that open the exact page, chunk, and surrounding context.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-enterprise-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-2">Autonomous Research Agent</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Deconstructs complex research prompts into multi-step plans, invoking controlled tools (vector search, calculator, CSV analytics, report synthesis).
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-enterprise-500/40 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-base mb-2">Structured CSV Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload spreadsheets to run automated aggregations, trend analyses, anomaly detection, and interactive chart visualizations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <p>Enterprise AI Research & Document Agent • Production Portfolio Project</p>
        <p className="mt-1">Architected with FastAPI, React, TypeScript, Qdrant Vector Engine, and Multi-Tenant Isolation.</p>
      </footer>
    </div>
  );
};
