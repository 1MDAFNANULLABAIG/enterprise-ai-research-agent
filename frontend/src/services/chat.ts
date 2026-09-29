import api, { API_BASE } from './api';
import { ConversationItem, MessageItem } from '../types';

export const chatService = {
  async listConversations(): Promise<ConversationItem[]> {
    const res = await api.get<ConversationItem[]>('/chat/conversations');
    return res.data;
  },

  async createConversation(title?: string, document_ids: string[] = []): Promise<ConversationItem> {
    const res = await api.post<ConversationItem>('/chat/conversations', { title, document_ids });
    return res.data;
  },

  async getConversation(id: string): Promise<ConversationItem> {
    const res = await api.get<ConversationItem>(`/chat/conversations/${id}`);
    return res.data;
  },

  async updateConversation(id: string, title?: string, document_ids?: string[]): Promise<ConversationItem> {
    const res = await api.put<ConversationItem>(`/chat/conversations/${id}`, { title, document_ids });
    return res.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/chat/conversations/${id}`);
  },

  async sendMessage(params: {
    conversation_id?: string;
    message: string;
    document_ids?: string[];
    provider?: string;
  }) {
    const res = await api.post('/chat/message', params);
    return res.data;
  },

  async sendFeedback(message_id: string, feedback: 'like' | 'dislike' | null) {
    const res = await api.post(`/chat/messages/${message_id}/feedback`, { feedback });
    return res.data;
  },

  streamMessage(
    params: {
      conversation_id?: string;
      message: string;
      document_ids?: string[];
      provider?: string;
    },
    callbacks: {
      onInit?: (convId: string) => void;
      onStatus?: (stage: string) => void;
      onToken?: (token: string) => void;
      onDone?: (payload: any) => void;
      onError?: (err: any) => void;
    }
  ) {
    const token = localStorage.getItem('token');
    const controller = new AbortController();

    fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream available.');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim();
              if (!jsonStr) continue;
              try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'init' && callbacks.onInit) {
                  callbacks.onInit(event.conversation_id);
                } else if (event.type === 'status' && callbacks.onStatus) {
                  callbacks.onStatus(event.stage);
                } else if (event.type === 'token' && callbacks.onToken) {
                  callbacks.onToken(event.token);
                } else if (event.type === 'done' && callbacks.onDone) {
                  callbacks.onDone(event);
                }
              } catch (e) {
                // ignore parsing error
              }
            }
          }
        }
      })
      .catch((err) => {
        if (callbacks.onError) callbacks.onError(err);
      });

    return () => controller.abort();
  },
};
