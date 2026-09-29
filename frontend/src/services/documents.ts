import api from './api';
import { DocumentItem, DocumentChunk } from '../types';

export const documentService = {
  async listDocuments(search?: string, status?: string): Promise<DocumentItem[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const res = await api.get<DocumentItem[]>('/documents', { params });
    return res.data;
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<DocumentItem>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await api.get<DocumentItem>(`/documents/${id}`);
    return res.data;
  },

  async getDocumentChunks(id: string): Promise<DocumentChunk[]> {
    const res = await api.get<DocumentChunk[]>(`/documents/${id}/chunks`);
    return res.data;
  },

  async previewDocument(id: string): Promise<{ type: string; content: string; pages?: number }> {
    const res = await api.get(`/documents/${id}/preview`);
    return res.data;
  },

  async renameDocument(id: string, filename: string): Promise<DocumentItem> {
    const res = await api.put<DocumentItem>(`/documents/${id}`, { filename });
    return res.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  }
};
