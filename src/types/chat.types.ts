export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSummary {
  _id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export interface ChatDetails extends ChatSummary {
  messages: ChatMessage[];
}
