import api from './api';
import { ResearchTaskItem } from '../types';

export const researchService = {
  async listTasks(): Promise<ResearchTaskItem[]> {
    const res = await api.get<ResearchTaskItem[]>('/research/tasks');
    return res.data;
  },

  async createTask(params: { prompt: string; title?: string; document_ids?: string[]; provider?: string }): Promise<ResearchTaskItem> {
    const res = await api.post<ResearchTaskItem>('/research/tasks', params);
    return res.data;
  },

  async getTask(id: string): Promise<ResearchTaskItem> {
    const res = await api.get<ResearchTaskItem>(`/research/tasks/${id}`);
    return res.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/research/tasks/${id}`);
  }
};
