import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calculator,
  Database,
  BookOpen,
  Send,
  Table as TableIcon
} from 'lucide-react';
import { researchService } from '../services/research';
import { documentService } from '../services/documents';
import { ResearchTaskItem, DocumentItem } from '../types';
import { CitationModal } from '../components/citations/CitationModal';

export const Research: React.FC = () => {
  const [tasks, setTasks] = useState<ResearchTaskItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [latestTask, setLatestTask] = useState<ResearchTaskItem | null>(null);
  const [activeCitationChunkId, setActiveCitationChunkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [t, d] = await Promise.all([
        researchService.listTasks(),
        documentService.listDocuments()
      ]);
      setTasks(t);
      setDocuments(d);
      if (t.length > 0 && !latestTask) {
        setLatestTask(t[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const task = await researchService.createTask({
        prompt: prompt.trim(),
        title: title.trim() || undefined,
        document_ids: selectedDocIds
      });
      setLatestTask(task);
      setTasks([task, ...tasks]);
      setPrompt('');
      setTitle('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to execute research task.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleToggleDoc = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <CitationModal
        chunkId={activeCitationChunkId}
        onClose={() => setActiveCitationChunkId(null)}
      />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Step Autonomous Research Agent</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Autonomous Deep Research Mode</h2>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          The agent formulates a multi-step execution plan, gathers empirical evidence across selected documents, runs quantitative computations, compares findings, and compiles a structured executive intelligence report with clickable citations.
        </p>
      </div>

      {/* Research Prompt Input Form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Initiate New Research Mission</h3>
        <form onSubmit={handleStartResearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Research Objective / Prompt
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Compare the financial performance described in ACME's report against the architecture scaling targets and verify cybersecurity compliance."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Report Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Strategic Performance Brief"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500 transition mb-3"
              />

              {/* Quick Prompt Suggestions */}
              <span className="text-[11px] text-slate-500 block mb-1">Preset Scenarios:</span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Compare the financial performance described in these reports and identify the major differences.');
                    setTitle('Comparative Financial Performance & Delta Analysis');
                  }}
                  className="w-full text-left text-[11px] text-slate-400 hover:text-enterprise-400 p-1.5 rounded bg-slate-950/80 border border-slate-800 truncate block transition"
                >
                  "Compare financial performance..."
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Evaluate cybersecurity encryption standards, token TTLs, and vector database multi-tenancy requirements.');
                    setTitle('Security Architecture & Compliance Audit');
                  }}
                  className="w-full text-left text-[11px] text-slate-400 hover:text-indigo-400 p-1.5 rounded bg-slate-950/80 border border-slate-800 truncate block transition"
                >
                  "Cybersecurity & AI guardrails audit..."
                </button>
              </div>
            </div>
          </div>

          {/* Document Scope Selection Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Document Scope ({selectedDocIds.length === 0 ? 'All Documents Selected' : `${selectedDocIds.length} Selected`}):
            </label>
            <div className="flex flex-wrap gap-2">
              {documents.map((d) => {
                const isSelected = selectedDocIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleToggleDoc(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-enterprise-600/20 border-enterprise-500 text-enterprise-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{d.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isExecuting || !prompt.trim()}
              className="bg-enterprise-600 hover:bg-enterprise-500 disabled:opacity-50 text-white font-medium text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-enterprise-600/25 flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Agent Planning & Executing Tools...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Research Agent</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Latest / Selected Research Report View */}
      {latestTask && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{latestTask.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {latestTask.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Objective: {latestTask.prompt}</p>
            </div>

            {latestTask.metrics && (
              <div className="text-xs font-mono text-slate-500">
                Executed in {latestTask.metrics.total_latency_ms || 450} ms • {latestTask.metrics.step_count || 5} steps
              </div>
            )}
          </div>

          {/* Autonomous Execution Plan Visualizer */}
          {latestTask.plan && latestTask.plan.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Agent Execution Plan & Tool Invocation Traces:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {latestTask.plan.map((step) => (
                  <div
                    key={step.step_number}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">Step 0{step.step_number}</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DONE</span>
                      </span>
                    </div>
                    <span className="font-semibold text-slate-200 block truncate">{step.title}</span>
                    <span className="font-mono text-[10px] text-enterprise-400 block bg-slate-900 px-1.5 py-0.5 rounded w-fit">
                      tool: {step.tool}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Report Artifact */}
          {latestTask.report && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-enterprise-400 uppercase tracking-wider">
                  1. Executive Summary
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {latestTask.report.executive_summary}
                </p>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  2. Key Findings & Empirical Observations:
                </span>
                <div className="space-y-2">
                  {latestTask.report.key_findings.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="font-mono text-enterprise-400 font-bold">[{idx + 1}]</span>
                      <span className="leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparison Table */}
              {latestTask.report.comparison_table && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    3. Structured Comparison Matrix:
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-900/50">
                          {latestTask.report.comparison_table.headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {latestTask.report.comparison_table.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            {row.map((cell, j) => (
                              <td key={j} className="py-2.5 px-3 text-slate-200">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conclusion */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  4. Evidence-Based Conclusion
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestTask.report.conclusion}
                </p>
              </div>

              {/* Clickable Grounded Sources */}
              {latestTask.report.sources && latestTask.report.sources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-enterprise-400 uppercase tracking-wider block">
                    5. Clickable Primary Source Citations ({latestTask.report.sources.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {latestTask.report.sources.map((src) => (
                      <div
                        key={src.chunk_id || src.source_index}
                        onClick={() => setActiveCitationChunkId(src.chunk_id)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-enterprise-500/40 cursor-pointer transition space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                            {src.document_name}
                          </span>
                          <span className="font-mono text-enterprise-400">Page {src.page_number}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 font-mono">
                          {src.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Previous Research Tasks History */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Previous Research Missions</h3>
        <div className="overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No previous research tasks found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Steps</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-medium text-slate-200 max-w-sm truncate">{t.title}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-medium">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">{t.plan?.length || 5} steps</td>
                    <td className="py-3 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setLatestTask(t)}
                        className="text-enterprise-400 hover:text-enterprise-300 font-medium text-xs"
                      >
                        Inspect Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
