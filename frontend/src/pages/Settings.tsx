import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Cpu,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Server
} from 'lucide-react';
import { settingsService } from '../services/extra';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.55);
  const [chunkSize, setChunkSize] = useState(600);
  const [chunkOverlap, setChunkOverlap] = useState(100);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getSettings()
      .then((s) => {
        setSettings(s);
        setSelectedProvider(s.default_llm_provider);
        setTopK(s.rag_top_k);
        setSimilarityThreshold(s.rag_similarity_threshold);
        setChunkSize(s.rag_chunk_size);
        setChunkOverlap(s.rag_chunk_overlap);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatePayload: any = {
        default_llm_provider: selectedProvider,
        rag_top_k: Number(topK),
        rag_similarity_threshold: Number(similarityThreshold),
        rag_chunk_size: Number(chunkSize),
        rag_chunk_overlap: Number(chunkOverlap)
      };

      if (geminiKey.trim()) updatePayload.gemini_api_key = geminiKey.trim();
      if (openaiKey.trim()) updatePayload.openai_api_key = openaiKey.trim();
      if (anthropicKey.trim()) updatePayload.anthropic_api_key = anthropicKey.trim();

      const updated = await settingsService.updateSettings(updatePayload);
      setSettings(updated);
      setGeminiKey('');
      setOpenaiKey('');
      setAnthropicKey('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-enterprise-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading system configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings & LLM Layer</h2>
        <p className="text-xs text-slate-400">
          Configure preferred LLM providers, enter external API keys securely, and calibrate RAG retrieval parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* LLM Provider Selection */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-enterprise-400" />
            <span>Active LLM Provider Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 2.5 Flash / 1.5 Pro', keySet: settings.has_gemini_key },
              { id: 'openai', name: 'OpenAI', desc: 'GPT-4o / GPT-4o-mini', keySet: settings.has_openai_key },
              { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3.5 Haiku / Sonnet', keySet: settings.has_anthropic_key },
              { id: 'fallback', name: 'Local Deterministic', desc: 'Zero API keys required', keySet: true },
            ].map((p) => {
              const isSelected = selectedProvider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-enterprise-950/40 border-enterprise-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block">{p.name}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{p.desc}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-mono ${p.keySet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {p.keySet ? 'Ready' : 'Key Needed'}
                    </span>
                    {isSelected && <span className="text-enterprise-400 font-bold">Active</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Secure API Credentials (Stored Server-Side Only)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Google Gemini API Key</label>
                <span className={`font-mono text-[10px] ${settings.has_gemini_key ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {settings.has_gemini_key ? '● Configured on server' : '○ Not configured'}
                </span>
              </div>
              <input
                type="password"
                placeholder={settings.has_gemini_key ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">OpenAI API Key</label>
                <span className={`font-mono text-[10px] ${settings.has_openai_key ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {settings.has_openai_key ? '● Configured on server' : '○ Not configured'}
                </span>
              </div>
              <input
                type="password"
                placeholder={settings.has_openai_key ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Anthropic API Key</label>
                <span className={`font-mono text-[10px] ${settings.has_anthropic_key ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {settings.has_anthropic_key ? '● Configured on server' : '○ Not configured'}
                </span>
              </div>
              <input
                type="password"
                placeholder={settings.has_anthropic_key ? '•••••••••••••••••••••••• (Leave blank to keep)' : 'sk-ant-...'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-enterprise-500"
              />
            </div>
          </div>
        </div>

        {/* RAG Hyperparameters */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>RAG Retrieval & Chunking Hyperparameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Top-K Retrieval Chunks: <strong className="text-enterprise-400">{topK}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-enterprise-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Number of candidate passages returned from vector search</span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Similarity Cutoff Threshold: <strong className="text-enterprise-400">{similarityThreshold}</strong>
              </label>
              <input
                type="range"
                min="0.30"
                max="0.90"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                className="w-full accent-enterprise-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Refuses answers if similarity falls below threshold</span>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Chunk Window Size (characters):
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-enterprise-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Chunk Overlap (characters):
              </label>
              <input
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-enterprise-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration saved successfully!</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-enterprise-600 hover:bg-enterprise-500 disabled:opacity-50 text-white font-medium text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-enterprise-600/20 flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
