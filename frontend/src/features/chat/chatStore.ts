import { createStore } from '../../app/createStore';
import type { ChatMessage } from './chat.types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome-message',
    role: 'assistant',
    content: '你好！我是 ccHub 的 AI 助手。我可以帮你查询和管理你的 TODO、GitHub 工具收藏等信息。有什么我可以帮你的吗？',
    timestamp: new Date().toISOString(),
  },
];

const chatStore = createStore<ChatState>({
  messages: initialMessages,
  loading: false,
  error: null,
});

export const useChatStore = chatStore.useStore;
export const getChatState = chatStore.getState;

export function appendChatMessage(message: ChatMessage) {
  chatStore.setState((state) => ({
    messages: [...state.messages, message],
  }));
}

export function setChatLoading(loading: boolean) {
  chatStore.setState({ loading });
}

export function setChatError(error: string | null) {
  chatStore.setState({ error });
}

export function resetChat() {
  chatStore.setState({
    messages: initialMessages,
    loading: false,
    error: null,
  });
}
