import React, { useEffect, useState } from 'react';
import { X, BookOpen, ExternalLink, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { citationService } from '../../services/extra';

interface CitationModalProps {
  chunkId: string | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ chunkId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSurrounding, setShowSurrounding] = useState<boolean>(false);

  useEffect(() => {
    if (!chunkId) return;
    setLoading(true);
    citationService
      .getCitation(chunkId)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [chunkId]);

  if (!chunkId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-enterprise-500/10 text-enterprise-400 border border-enterprise-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Verified Source Citation</h3>
              <p className="text-xs text-slate-400">Strictly grounded empirical document chunk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-enterprise-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching grounded document evidence...</span>
            </div>
          ) : data ? (
            <>
              {/* Metadata tags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Document</span>
                  <span className="font-medium text-slate-200 truncate block" title={data.document_name}>
                    {data.document_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Page Number</span>
                  <span className="font-medium text-enterprise-400">Page {data.page_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Format</span>
                  <span className="uppercase font-medium text-slate-300">{data.file_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Section</span>
                  <span className="font-medium text-slate-300 truncate block">
                    {data.section_title || 'General'}
                  </span>
                </div>
              </div>

              {/* Exact Cited Paragraph */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-enterprise-400">
                  <CheckCircle2 className="w-4 h-4 text-enterprise-400" />
                  <span>Exact Cited Evidence Paragraph:</span>
                </div>
                <div className="p-4 rounded-lg bg-enterprise-950/20 border border-enterprise-500/30 text-slate-100 font-mono text-xs leading-relaxed selection:bg-enterprise-500/40">
                  {data.content}
                </div>
              </div>

              {/* Surrounding Context Toggle */}
              {(data.prev_context || data.next_context) && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowSurrounding(!showSurrounding)}
                    className="text-xs text-slate-400 hover:text-enterprise-400 flex items-center gap-1 transition"
                  >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showSurrounding ? 'rotate-90' : ''}`} />
                    <span>{showSurrounding ? 'Hide Surrounding Context' : 'Show Surrounding Document Context (±1 chunk)'}</span>
                  </button>

                  {showSurrounding && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-800">
                      {data.prev_context && (
                        <div>
                          <span className="text-[11px] text-slate-500 block mb-1">Preceding Chunk:</span>
                          <p className="text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded border border-slate-800">
                            {data.prev_context}
                          </p>
                        </div>
                      )}
                      {data.next_context && (
                        <div>
                          <span className="text-[11px] text-slate-500 block mb-1">Subsequent Chunk:</span>
                          <p className="text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded border border-slate-800">
                            {data.next_context}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-400 text-center py-6">Could not load citation details.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-xs text-slate-500">
          <span>Zero Hallucination Guarantee • Grounded in Vector DB</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
