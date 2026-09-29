import api from './api';
import { AppSettings, User, EvaluationRun, CSVMetadata, CSVQueryResult } from '../types';

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const res = await api.get<AppSettings>('/settings');
    return res.data;
  },

  async updateSettings(update: Partial<AppSettings> & { gemini_api_key?: string; openai_api_key?: string; anthropic_api_key?: string }): Promise<AppSettings> {
    const res = await api.put<AppSettings>('/settings', update);
    return res.data;
  }
};

export const adminService = {
  async getUsers(): Promise<User[]> {
    const res = await api.get<User[]>('/admin/users');
    return res.data;
  },

  async getAuditLogs(limit: number = 50) {
    const res = await api.get('/admin/audit-logs', { params: { limit } });
    return res.data;
  },

  async getMetrics() {
    const res = await api.get('/admin/metrics');
    return res.data;
  }
};

export const evaluationService = {
  async runEvaluation(params: { name?: string; top_k?: number; provider?: string }): Promise<EvaluationRun> {
    const res = await api.post<EvaluationRun>('/evaluation/run', params);
    return res.data;
  },

  async getRuns(): Promise<EvaluationRun[]> {
    const res = await api.get<EvaluationRun[]>('/evaluation/runs');
    return res.data;
  },

  async getRun(id: string): Promise<EvaluationRun> {
    const res = await api.get<EvaluationRun>(`/evaluation/runs/${id}`);
    return res.data;
  }
};

export const csvService = {
  async getSchema(documentId: string): Promise<CSVMetadata> {
    const res = await api.get<CSVMetadata>(`/csv/${documentId}/schema`);
    return res.data;
  },

  async queryCSV(documentId: string, query: string, chartType: string = 'bar'): Promise<CSVQueryResult> {
    const res = await api.post<CSVQueryResult>('/csv/query', {
      document_id: documentId,
      query,
      chart_type: chartType
    });
    return res.data;
  }
};

export const citationService = {
  async getCitation(chunkId: string) {
    const res = await api.get(`/citations/${chunkId}`);
    return res.data;
  }
};
