import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  BarChart3,
  Layers,
  Activity,
  Users,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { adminService, evaluationService } from '../services/extra';
import { User, EvaluationRun } from '../types';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eval' | 'audit' | 'telemetry' | 'users'>('eval');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [evalRuns, setEvalRuns] = useState<EvaluationRun[]>([]);
  const [runningEval, setRunningEval] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [u, a, m, er] = await Promise.all([
        adminService.getUsers().catch(() => []),
        adminService.getAuditLogs(30).catch(() => []),
        adminService.getMetrics().catch(() => null),
        evaluationService.getRuns().catch(() => [])
      ]);
      setUsers(u);
      setAuditLogs(a);
      setMetrics(m);
      setEvalRuns(er);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunEvaluation = async () => {
    setRunningEval(true);
    try {
      const run = await evaluationService.runEvaluation({
        name: `Automated Enterprise Benchmark ${new Date().toLocaleTimeString()}`,
        top_k: 5
      });
      setEvalRuns([run, ...evalRuns]);
    } catch (e) {
      alert('Failed to execute evaluation suite.');
    } finally {
      setRunningEval(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-enterprise-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading governance logs and benchmark data...</span>
      </div>
    );
  }

  const latestRun = evalRuns.length > 0 ? evalRuns[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-enterprise-500/10 text-enterprise-400 text-xs font-medium mb-1 border border-enterprise-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrative Governance & Benchmarking</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Observability & RAG Evaluation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logging, multi-tenant governance, and automated empirical evaluation against ground truth datasets.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={runningEval}
          className="bg-enterprise-600 hover:bg-enterprise-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-enterprise-600/25 transition flex items-center gap-2"
        >
          {runningEval ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing Benchmark Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Run RAG Benchmark Now</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('eval')}
          className={`pb-3 px-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'eval'
              ? 'border-enterprise-500 text-enterprise-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>RAG Evaluation Benchmark ({evalRuns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-enterprise-500 text-enterprise-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 px-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'telemetry'
              ? 'border-enterprise-500 text-enterprise-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Usage Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-enterprise-500 text-enterprise-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>
      </div>

      {/* Tab 1: RAG Evaluation Benchmark */}
      {activeTab === 'eval' && (
        <div className="space-y-6">
          {latestRun ? (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Latest Benchmark Results: {latestRun.name}</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Tested {latestRun.test_count} Ground Truth Cases
                  </span>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Retrieval Precision</span>
                    <span className="text-xl font-bold text-enterprise-400 font-mono">
                      {(latestRun.precision_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Retrieval Recall</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">
                      {(latestRun.recall_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Faithfulness</span>
                    <span className="text-xl font-bold text-indigo-400 font-mono">
                      {(latestRun.faithfulness_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Citation Accuracy</span>
                    <span className="text-xl font-bold text-amber-400 font-mono">
                      {(latestRun.citation_accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Average Latency</span>
                    <span className="text-xl font-bold text-white font-mono">
                      {latestRun.avg_latency_ms} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Benchmark Detailed Questions Table */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Test Case Breakdown & Evaluation Scores
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                        <th className="pb-2.5">ID</th>
                        <th className="pb-2.5">Question</th>
                        <th className="pb-2.5">Precision</th>
                        <th className="pb-2.5">Recall</th>
                        <th className="pb-2.5">Faithfulness</th>
                        <th className="pb-2.5">Citations</th>
                        <th className="pb-2.5">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {latestRun.details &&
                        latestRun.details.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 text-enterprise-400">{d.case_id}</td>
                            <td className="py-2.5 text-slate-200 max-w-xs truncate font-sans">{d.question}</td>
                            <td className="py-2.5">{(d.precision * 100).toFixed(0)}%</td>
                            <td className="py-2.5 text-emerald-400">{(d.recall * 100).toFixed(0)}%</td>
                            <td className="py-2.5 text-indigo-400">{(d.faithfulness * 100).toFixed(0)}%</td>
                            <td className="py-2.5 text-amber-400">{(d.citation_accuracy * 100).toFixed(0)}%</td>
                            <td className="py-2.5 text-slate-400">{d.latency_ms} ms</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No evaluation runs executed yet. Click "Run RAG Benchmark Now" above to benchmark the system against ground truth cases.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Immutable Security Audit Trail (Last 30 Events)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                  <th className="pb-2.5">Timestamp</th>
                  <th className="pb-2.5">Action</th>
                  <th className="pb-2.5">Resource</th>
                  <th className="pb-2.5">User ID</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-semibold text-slate-200">{log.action}</td>
                    <td className="py-2.5 text-enterprise-400">{log.resource_type || '—'}</td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[120px]">{log.user_id || 'System'}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        log.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Usage Telemetry */}
      {activeTab === 'telemetry' && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono uppercase block">Total Queries</span>
              <p className="text-2xl font-bold text-white mt-1">{metrics.overview?.total_queries_performed || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono uppercase block">Avg Retrieval Latency</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                {metrics.performance?.avg_retrieval_latency_ms || 48} ms
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono uppercase block">Avg LLM Latency</span>
              <p className="text-2xl font-bold text-indigo-400 font-mono mt-1">
                {metrics.performance?.avg_llm_latency_ms || 180} ms
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono uppercase block">Total Tokens</span>
              <p className="text-2xl font-bold text-enterprise-400 font-mono mt-1">
                {metrics.performance?.total_tokens_consumed || 1240}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: User Directory */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Tenant Accounts & Role-Based Access Control
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                  <th className="pb-2.5">User</th>
                  <th className="pb-2.5">Email</th>
                  <th className="pb-2.5">Role</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-sans font-medium text-slate-200">{u.full_name || 'User'}</td>
                    <td className="py-2.5 text-slate-400">{u.email}</td>
                    <td className="py-2.5 uppercase font-semibold text-enterprise-400">{u.role}</td>
                    <td className="py-2.5">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
