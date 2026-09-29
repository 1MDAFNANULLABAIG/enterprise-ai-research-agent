import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Files,
  Search,
  Trash2,
  Edit2,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  HardDrive
} from 'lucide-react';
import { documentService } from '../services/documents';
import { DocumentItem } from '../types';

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<{ id: string; name: string } | null>(null);

  const fetchDocs = async () => {
    try {
      const data = await documentService.listDocuments(search);
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await documentService.uploadDocument(file);
      await fetchDocs();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This removes all vector embeddings and chunks.`)) return;
    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    try {
      const updated = await documentService.renameDocument(editingDoc.id, editingDoc.name);
      setDocuments(documents.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDoc(null);
    } catch (err) {
      alert('Failed to rename document.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Upload Zone */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Document Ingestion Pipeline</h3>
            <p className="text-xs text-slate-400">
              Upload PDF, DOCX, TXT or CSV files. Automatically parsed, chunked, and embedded into vector storage.
            </p>
          </div>

          <label className="bg-enterprise-600 hover:bg-enterprise-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-enterprise-600/20 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing & Ingesting...' : 'Upload New Document'}</span>
            <input
              type="file"
              disabled={uploading}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt,.csv"
              className="hidden"
            />
          </label>
        </div>

        {uploadError && (
          <div className="p-3 mb-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF (Multi-page parsing)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>DOCX (Structured paragraphs)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV (Tabular & analytics)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>TXT (Plain text & markdown)</span>
          </div>
        </div>
      </div>

      {/* Document Search & List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search uploaded documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500 transition"
            />
          </div>

          <button
            onClick={fetchDocs}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 self-end sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-enterprise-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading document catalog...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No documents found. Use the upload button above to ingest files.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3">Document Name</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Pages</th>
                  <th className="pb-3">Chunks</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 font-medium text-slate-200">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="hover:text-enterprise-400 flex items-center gap-2 max-w-sm truncate"
                      >
                        <FileText className="w-4 h-4 text-enterprise-400 shrink-0" />
                        <span className="truncate">{doc.filename}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 uppercase font-mono text-slate-400">{doc.file_type}</td>
                    <td className="py-3.5 font-mono text-slate-400">{formatBytes(doc.file_size_bytes)}</td>
                    <td className="py-3.5 font-mono text-slate-300">{doc.page_count}</td>
                    <td className="py-3.5 font-mono text-enterprise-400 font-semibold">{doc.chunk_count}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-medium font-mono ${
                        doc.status === 'INDEXED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : doc.status === 'PROCESSING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : doc.status === 'UPLOADED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === 'INDEXED' ? 'bg-emerald-400' : doc.status === 'PROCESSING' ? 'bg-amber-400 animate-ping' : 'bg-slate-400'
                        }`}></span>
                        <span>{doc.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Link
                        to={`/documents/${doc.id}`}
                        title="View Chunks & Details"
                        className="p-1.5 text-slate-400 hover:text-enterprise-400 hover:bg-slate-800 rounded transition inline-block"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setEditingDoc({ id: doc.id, name: doc.filename })}
                        title="Rename"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        title="Delete Document"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-sm font-semibold text-white mb-3">Rename Document</h4>
            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                value={editingDoc.name}
                onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-enterprise-500"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-enterprise-600 hover:bg-enterprise-500 text-white font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
