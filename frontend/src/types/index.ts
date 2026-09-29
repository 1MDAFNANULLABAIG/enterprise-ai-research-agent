export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'csv';
  file_size_bytes: number;
  page_count: number;
  chunk_count: number;
  status: 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  page_number: number;
  section_title?: string;
  content: string;
  token_count: number;
}

export interface CitationItem {
  source_index: number;
  document_id: string;
  document_name: string;
  chunk_id: string;
  page_number: number;
  section_title?: string;
  excerpt: string;
  score: number;
}

export interface LatencyMetrics {
  retrieval_ms: number;
  llm_ms: number;
  total_ms: number;
  tokens?: number;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: CitationItem[];
  metrics?: LatencyMetrics;
  feedback?: 'like' | 'dislike' | null;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  user_id: string;
  title: string;
  document_ids: string[];
  created_at: string;
  updated_at: string;
  messages: MessageItem[];
}

export interface ResearchPlanStep {
  step_number: number;
  title: string;
  tool: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  input_params: Record<string, any>;
  output_summary?: string;
  latency_ms?: number;
}

export interface ResearchReport {
  title: string;
  executive_summary: string;
  key_findings: string[];
  comparison_table?: {
    headers: string[];
    rows: (string | number)[][];
  };
  evidence: { doc: string; page: number; text: string }[];
  conclusion: string;
  sources: CitationItem[];
}

export interface ResearchTaskItem {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  document_ids: string[];
  status: 'PENDING' | 'PLANNING' | 'RESEARCHING' | 'COMPLETED' | 'FAILED';
  plan: ResearchPlanStep[];
  execution_steps: any[];
  report?: ResearchReport;
  metrics: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface AppSettings {
  default_llm_provider: string;
  gemini_model: string;
  openai_model: string;
  anthropic_model: string;
  has_gemini_key: boolean;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
  vector_db_type: string;
  embedding_provider: string;
  embedding_dimension: number;
  rag_top_k: number;
  rag_similarity_threshold: number;
  rag_chunk_size: number;
  rag_chunk_overlap: number;
}

export interface CSVMetadata {
  document_id: string;
  row_count: number;
  column_count: number;
  columns: string[];
  column_types: Record<string, string>;
  summary_stats: Record<string, any>;
  sample_rows: Record<string, any>[];
}

export interface CSVQueryResult {
  answer: string;
  query_executed: string;
  result_data: any[];
  chart_data?: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
  execution_time_ms: number;
}

export interface EvaluationRun {
  id: string;
  name: string;
  test_count: number;
  precision_score: number;
  recall_score: number;
  faithfulness_score: number;
  citation_accuracy: number;
  avg_latency_ms: number;
  status: string;
  details: any[];
  created_at: string;
}
