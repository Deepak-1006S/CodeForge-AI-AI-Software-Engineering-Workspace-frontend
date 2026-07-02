import apiClient, { API_URL, getStoredAuthSession } from './api';
import type { ChatDetails, ChatMessage, ChatSummary } from '@/types';

export const getChats = async (): Promise<ChatSummary[]> => {
  const response = await apiClient.get('/chats');
  return response.data.data.chats;
};

export const getChat = async (chatId: string): Promise<ChatDetails> => {
  const response = await apiClient.get(`/chats/${chatId}`);
  return response.data.data.chat;
};

export const createChat = async (title?: string): Promise<ChatDetails> => {
  const response = await apiClient.post('/chats', { title });
  return response.data.data.chat;
};

export const updateChat = async (chatId: string, payload: { title?: string; pinned?: boolean }): Promise<ChatDetails> => {
  const response = await apiClient.patch(`/chats/${chatId}`, payload);
  return response.data.data.chat;
};

export const deleteChat = async (chatId: string): Promise<string> => {
  const response = await apiClient.delete(`/chats/${chatId}`);
  return response.data.data.chatId;
};

const getAuthHeaders = (): Record<string, string> => {
  const { accessToken } = getStoredAuthSession();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const parseSSEChunk = (chunk: string) => {
  const lines = chunk.split('\n');
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim() || 'message';
  const dataLines = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5));
  const data = dataLines.join('\n').trim();
  return { event, data };
};

export const streamChatResponse = async (
  path: string,
  payload: Record<string, unknown>,
  handlers: {
    onMessage: (entry: { content: string; partial?: boolean }) => void;
    onDone: (entry: { content: string; chatId: string }) => void;
    onError: (message: string) => void;
  }
): Promise<AbortController> => {
  const controller = new AbortController();
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: 'include',
    signal: controller.signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'AI chat stream request failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Stream not available from server');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const processEvent = (rawEvent: string) => {
    const { event, data } = parseSSEChunk(rawEvent);
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      if (event === 'done') {
        handlers.onDone(parsed);
      } else if (event === 'error') {
        handlers.onError(parsed.message || 'AI chat stream failed');
      } else {
        handlers.onMessage(parsed);
      }
    } catch (error) {
      handlers.onError('Failed to parse AI stream payload.');
    }
  };

  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) {
        processEvent(buffer);
      }
      return;
    }

    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      processEvent(rawEvent);
      boundary = buffer.indexOf('\n\n');
    }

    return pump();
  };

  pump().catch((error) => {
    if (error.name !== 'AbortError') {
      handlers.onError(error instanceof Error ? error.message : 'AI chat stream failed');
    }
  });

  return controller;
};

export const sendChatMessage = async (chatId: string, message: string, code?: string, language?: string) => {
  return apiClient.post(`/chats/${chatId}/messages`, { message, code, language }, { responseType: 'stream' });
};

export const continueChat = async (chatId: string) => {
  return apiClient.post(`/chats/${chatId}/continue`, null, { responseType: 'stream' });
};

export const regenerateChat = async (chatId: string) => {
  return apiClient.post(`/chats/${chatId}/regenerate`, null, { responseType: 'stream' });
};
