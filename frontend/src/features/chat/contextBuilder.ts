import { githubToolsApi } from '../../api/githubToolsApi';
import { todoApi } from '../../api/todoApi';
import type { ChatMessage, ConversationContextSnapshot, LlmRequestMessage } from './chat.types';

export async function buildConversationContext(): Promise<ConversationContextSnapshot> {
  const degradedSources: string[] = [];
  let content = '你是 ccHub 的助手。以下是当前用户上下文：\n\n';

  try {
    const todos = await todoApi.getAll();
    if (todos.length > 0) {
      content += '## TODO 列表\n';
      for (const todo of todos) {
        content += `- ${todo.title} ${todo.status === 'done' ? '[已完成]' : '[未完成]'}\n`;
      }
      content += '\n';
    }
  } catch {
    degradedSources.push('todos');
  }

  try {
    const collection = await githubToolsApi.getCollection('deep_use');
    if (collection.length > 0) {
      content += '## 深度使用的 GitHub 工具\n';
      for (const record of collection) {
        content += `- ${record.tool.name}: ${record.tool.description || '无描述'}\n`;
      }
      content += '\n';
    }
  } catch {
    degradedSources.push('github-tools');
  }

  if (degradedSources.length > 0) {
    content += `## 上下文降级\n- 以下来源暂时不可用：${degradedSources.join('、')}\n`;
  }

  return {
    content,
    degradedSources,
    generatedAt: new Date().toISOString(),
  };
}

export function buildLlmMessages(messages: ChatMessage[], context: ConversationContextSnapshot): LlmRequestMessage[] {
  return [
    {
      role: 'system',
      content: context.content,
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}
