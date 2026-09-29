import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Layers,
  BarChart2,
  Table as TableIcon,
  Search,
  Eye,
  CheckCircle2,
  Cpu,
  Clock,
  Send
} from 'lucide-react';
import { documentService } from '../services/documents';
import { csvService } from '../services/extra';
import { DocumentItem, DocumentChunk, CSVMetadata, CSVQueryResult } from '../types';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [preview, setPreview] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chunks' | 'preview' | 'csv'>('chunks');
  const [chunkSearch, setChunkSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // CSV analysis states
  const [csvSchema, setCsvSchema] = useState<CSVMetadata | null>(null);
  const [csvQuery, setCsvQuery] = useState('');
  const [csvResult, setCsvResult] = useState<CSVQueryResult | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      documentService.getDocument(id),
      documentService.getDocumentChunks(id),
      documentService.previewDocument(id).catch(() => ({ content: '' }))
    ])
      .then(([d, ch, prev]) => {
        setDoc(d);
        setChunks(ch);
        setPreview(prev.content || '');

        if (d.file_type.toLowerCase() === 'csv') {
          setActiveTab('csv');
          csvService.getSchema(d.id).then((s) => setCsvSchema(s)).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRunCsvQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !csvQuery.trim()) return;
    setCsvLoading(true);
    try {
      const res = await csvService.queryCSV(id, csvQuery);
      setCsvResult(res);
    } catch (e) {
      alert('CSV query execution failed.');
    } finally {
      setCsvLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-enterprise-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Retrieving document metadata and vector chunks...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        Document not found.{' '}
        <Link to="/documents" className="text-enterprise-400 underline">
          Back to Documents
        </Link>
      </div>
    );
  }

  const filteredChunks = chunks.filter(
    (c) =>
      c.content.toLowerCase().includes(chunkSearch.toLowerCase()) ||
      (c.section_title && c.section_title.toLowerCase().includes(chunkSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document Repository</span>
        </Link>
      </div>

      {/* Document Metadata Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-enterprise-500/10 text-enterprise-400 border border-enterprise-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{doc.filename}</h2>
              <p className="text-xs text-slate-400">Original: {doc.original_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${
              doc.status === 'INDEXED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'
            }`}>
              {doc.status}
            </span>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block">Format</span>
            <span className="font-mono uppercase text-slate-200">{doc.file_type}</span>
          </div>
          <div>
            <span className="text-slate-500 block">File Size</span>
            <span className="font-mono text-slate-200">{(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="text-slate-500 block">Page Count</span>
            <span className="font-mono text-slate-200">{doc.page_count} pages</span>
          </div>
          <div>
            <span className="text-slate-500 block">Indexed Chunks</span>
            <span className="font-mono font-semibold text-enterprise-400">{doc.chunk_count} chunks</span>
          </div>
          <div>
            <span className="text-slate-500 block">Ingestion Date</span>
            <span className="text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('chunks')}
          className={`pb-3 px-3 text-xs font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'chunks'
              ? 'border-enterprise-500 text-enterprise-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Extracted Vector Chunks ({chunks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3 px-3 text-xs font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'preview'
              ? 'border-enterprise-500 text-enterprise-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Raw Content Preview</span>
        </button>

        {doc.file_type.toLowerCase() === 'csv' && (
          <button
            onClick={() => setActiveTab('csv')}
            className={`pb-3 px-3 text-xs font-semibold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'csv'
                ? 'border-enterprise-500 text-enterprise-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Structured CSV Analytics</span>
          </button>
        )}
      </div>

      {/* Tab 1: Extracted Vector Chunks */}
      {activeTab === 'chunks' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search inside extracted chunks..."
              value={chunkSearch}
              onChange={(e) => setChunkSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500 transition"
            />
          </div>

          <div className="space-y-3">
            {filteredChunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-enterprise-400 bg-enterprise-500/10 px-2 py-0.5 rounded border border-enterprise-500/20">
                      Chunk #{chunk.chunk_index + 1}
                    </span>
                    <span className="text-slate-400 font-mono">Page {chunk.page_number}</span>
                    {chunk.section_title && (
                      <span className="text-slate-400 font-medium truncate max-w-xs">
                        • {chunk.section_title}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{chunk.token_count} words / tokens</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed border border-slate-800/80">
                  {chunk.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Raw Preview */}
      {activeTab === 'preview' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
          {preview || 'No raw preview available.'}
        </div>
      )}

      {/* Tab 3: CSV Analytics */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Query Box */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-white">Natural Language CSV Query & Aggregation</h4>
            <p className="text-xs text-slate-400">
              Ask questions such as: "What is the average revenue?", "Which product has the highest sales?", "Show trends by quarter", or "Identify anomalies".
            </p>

            <form onSubmit={handleRunCsvQuery} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Which product has the highest revenue in North America?"
                value={csvQuery}
                onChange={(e) => setCsvQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-enterprise-500"
              />
              <button
                type="submit"
                disabled={csvLoading || !csvQuery.trim()}
                className="bg-enterprise-600 hover:bg-enterprise-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
              >
                {csvLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Run Analysis</span>
                  </>
                )}
              </button>
            </form>

            {/* Suggested quick queries */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500">Quick queries:</span>
              <button
                type="button"
                onClick={() => setCsvQuery('What is the average revenue across products?')}
                className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              >
                Average revenue
              </button>
              <button
                type="button"
                onClick={() => setCsvQuery('Which product has the highest revenue?')}
                className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              >
                Top revenue product
              </button>
              <button
                type="button"
                onClick={() => setCsvQuery('Show monthly trends')}
                className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              >
                Quarterly trends
              </button>
              <button
                type="button"
                onClick={() => setCsvQuery('Identify anomalies')}
                className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              >
                Detect anomalies
              </button>
            </div>
          </div>

          {/* Query Result & Chart */}
          {csvResult && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-enterprise-400">Analysis Result</span>
                <span className="font-mono text-slate-500">Executed in {csvResult.execution_time_ms} ms</span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200">
                {csvResult.answer}
              </div>

              {/* Chart Visualization */}
              {csvResult.chart_data && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 h-64 flex flex-col justify-center">
                  <Bar
                    data={{
                      labels: csvResult.chart_data.labels,
                      datasets: csvResult.chart_data.datasets.map((d) => ({
                        ...d,
                        backgroundColor: 'rgba(12, 141, 233, 0.7)',
                        borderColor: '#0c8de9',
                        borderWidth: 1,
                      })),
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: '#94a3b8' } },
                      },
                      scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Schema Sample Rows */}
          {csvSchema && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                First 10 Data Rows ({csvSchema.row_count} total rows)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                      {csvSchema.columns.map((col) => (
                        <th key={col} className="pb-2 pr-4">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {csvSchema.sample_rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        {csvSchema.columns.map((col) => (
                          <td key={col} className="py-2 pr-4 text-slate-300">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
