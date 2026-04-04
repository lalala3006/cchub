export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationContextSnapshot {
  content: string;
  degradedSources: string[];
  generatedAt: string;
}

export interface LlmRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
