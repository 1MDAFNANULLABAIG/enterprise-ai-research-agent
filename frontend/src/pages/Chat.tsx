import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Layers,
  ChevronDown,
  Activity,
  Zap,
  Info,
  Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatService } from '../services/chat';
import { documentService } from '../services/documents';
import { ConversationItem, MessageItem, DocumentItem, CitationItem } from '../types';
import { CitationModal } from '../components/citations/CitationModal';

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStage, setStreamingStage] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeCitationChunkId, setActiveCitationChunkId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations and documents
  useEffect(() => {
    Promise.all([
      chatService.listConversations().catch(() => []),
      documentService.listDocuments().catch(() => [])
    ]).then(([convs, docs]) => {
      setConversations(convs);
      setDocuments(docs);
      if (convs.length > 0) {
        loadConversation(convs[0].id);
      }
    });
  }, []);

  const loadConversation = async (id: string) => {
    setCurrentConvId(id);
    try {
      const conv = await chatService.getConversation(id);
      setMessages(conv.messages || []);
      setSelectedDocIds(conv.document_ids || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, streamingStage]);

  const handleNewConversation = async () => {
    try {
      const conv = await chatService.createConversation('New Conversation', selectedDocIds);
      setConversations([conv, ...conversations]);
      setCurrentConvId(conv.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await chatService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (currentConvId === id) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          setCurrentConvId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistic user message
    const tempUserMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConvId || '',
      role: 'user',
      content: userText,
      citations: [],
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsStreaming(true);
    setStreamingStage('Searching documents...');
    setStreamingContent('');

    let currentText = '';

    chatService.streamMessage(
      {
        conversation_id: currentConvId || undefined,
        message: userText,
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined
      },
      {
        onInit: (convId) => {
          if (!currentConvId) {
            setCurrentConvId(convId);
            chatService.listConversations().then(setConversations);
          }
        },
        onStatus: (stage) => {
          setStreamingStage(stage);
        },
        onToken: (token) => {
          setStreamingStage(null);
          currentText += token;
          setStreamingContent(currentText);
        },
        onDone: (payload) => {
          setIsStreaming(false);
          setStreamingStage(null);
          setStreamingContent('');

          const assistantMsg: MessageItem = {
            id: `asst-${Date.now()}`,
            conversation_id: currentConvId || '',
            role: 'assistant',
            content: currentText,
            citations: payload.citations || [],
            metrics: payload.metrics,
            created_at: new Date().toISOString()
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: (err) => {
          setIsStreaming(false);
          setStreamingStage(null);
          setStreamingContent('');
          alert('Failed to generate streaming response.');
        }
      }
    );
  };

  const handleFeedback = async (msgId: string, type: 'like' | 'dislike') => {
    try {
      await chatService.sendFeedback(msgId, type);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedback: type } : m))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render message with clickable citation badges
  const renderMessageContent = (content: string, citations: CitationItem[]) => {
    // Regex for [Source X, Page Y] or [Source X]
    const citationRegex = /\[Source\s+(\d+)(?:,\s*Page\s*(\d+))?\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      const sourceIdx = parseInt(match[1]);
      const matchedCitation = citations.find((c) => c.source_index === sourceIdx) || citations[sourceIdx - 1];

      parts.push(
        <button
          key={`cite-${matchIndex}`}
          type="button"
          onClick={() => {
            if (matchedCitation) {
              setActiveCitationChunkId(matchedCitation.chunk_id);
            }
          }}
          className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-enterprise-500/20 hover:bg-enterprise-500/30 text-enterprise-300 font-mono text-[11px] font-semibold border border-enterprise-500/30 transition align-baseline shadow-sm cursor-pointer"
          title={`Click to view verified source chunk: ${matchedCitation?.document_name || 'Document'}`}
        >
          <BookOpen className="w-3 h-3 text-enterprise-400" />
          <span>{match[0]}</span>
        </button>
      );

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <div className="space-y-2 prose prose-invert prose-sm max-w-none text-slate-100">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 overflow-hidden bg-slate-950">
      {/* Citation Inspector Modal */}
      <CitationModal
        chunkId={activeCitationChunkId}
        onClose={() => setActiveCitationChunkId(null)}
      />

      {/* Conversations Left Panel */}
      <div className="w-72 border-r border-slate-800 bg-slate-950/70 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversations</span>
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-lg bg-enterprise-600 hover:bg-enterprise-500 text-white transition shadow-sm"
            title="New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No chats yet.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`p-2.5 rounded-lg text-xs font-medium cursor-pointer transition flex items-center justify-between group ${
                  currentConvId === c.id
                    ? 'bg-slate-900 border border-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className="w-3.5 h-3.5 text-enterprise-400 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Scope Selector in Sidebar Bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-xs">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Document Scope:
          </label>
          <select
            value={selectedDocIds.length === 0 ? 'ALL' : selectedDocIds[0]}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDocIds(val === 'ALL' ? [] : [val]);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-enterprise-500 font-medium"
          >
            <option value="ALL">Entire Workspace ({documents.length} docs)</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-900/20 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-enterprise-500/10 text-enterprise-400 border border-enterprise-500/20 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">Grounded Enterprise AI Chat</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ask questions about your uploaded contracts, financial reports, architectural blueprints, or data sheets.
                Every claim will include verifiable source citations.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setInputMessage('What was ACME Corporation\'s total revenue in Q3 2025?')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
                >
                  "ACME Q3 revenue?"
                </button>
                <button
                  onClick={() => setInputMessage('What password hashing and MFA protocols are mandated?')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
                >
                  "Cybersecurity MFA standards?"
                </button>
                <button
                  onClick={() => setInputMessage('Compare the revenue performance between business units.')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
                >
                  "Compare business unit growth?"
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-enterprise-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-3xl rounded-2xl p-4 text-xs ${
                    msg.role === 'user'
                      ? 'bg-enterprise-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 rounded-tl-none shadow-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm font-normal leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Markdown Body */}
                      {renderMessageContent(msg.content, msg.citations)}

                      {/* Source Citation Cards Drawer */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                          <span className="text-[11px] font-semibold text-enterprise-400 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Grounded Source Citations ({msg.citations.length}):</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.citations.map((c) => (
                              <div
                                key={c.chunk_id || c.source_index}
                                onClick={() => setActiveCitationChunkId(c.chunk_id)}
                                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-enterprise-500/40 cursor-pointer transition space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                                    {c.document_name}
                                  </span>
                                  <span className="font-mono text-enterprise-400">Page {c.page_number}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-2 font-mono">
                                  {c.excerpt}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions & Latency Telemetry */}
                      <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500 border-t border-slate-800/60">
                        {msg.metrics ? (
                          <span className="font-mono">
                            Retrieval: {msg.metrics.retrieval_ms}ms • LLM: {msg.metrics.llm_ms}ms • Total: {msg.metrics.total_ms}ms
                          </span>
                        ) : (
                          <span>Grounded RAG</span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="hover:text-slate-200 transition"
                            title="Copy answer"
                          >
                            {copiedId === msg.id ? 'Copied' : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`transition ${msg.feedback === 'like' ? 'text-enterprise-400' : 'hover:text-slate-200'}`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`transition ${msg.feedback === 'dislike' ? 'text-red-400' : 'hover:text-slate-200'}`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Streaming Indicator & Tokens */}
          {isStreaming && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-xl bg-enterprise-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="max-w-3xl rounded-2xl rounded-tl-none p-4 bg-slate-900 border border-slate-800 text-xs shadow-md space-y-3">
                {streamingStage && (
                  <div className="flex items-center gap-2 text-enterprise-400 font-medium animate-pulse">
                    <Activity className="w-4 h-4" />
                    <span>{streamingStage}</span>
                  </div>
                )}

                {streamingContent && (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Ask a question about your documents (e.g. Compare revenue between Q2 and Q3)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isStreaming}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-enterprise-500 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputMessage.trim()}
              className="bg-enterprise-600 hover:bg-enterprise-500 disabled:opacity-50 text-white font-medium px-5 rounded-xl transition flex items-center gap-2 text-xs shadow-md shadow-enterprise-600/20 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
