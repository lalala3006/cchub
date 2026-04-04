import { describe, expect, it, vi } from 'vitest';
import { buildConversationContext, buildLlmMessages } from './contextBuilder';
import { todoApi } from '../../api/todoApi';
import { githubToolsApi } from '../../api/githubToolsApi';

vi.mock('../../api/todoApi', () => ({
  todoApi: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../api/githubToolsApi', () => ({
  githubToolsApi: {
    getCollection: vi.fn(),
  },
}));

describe('contextBuilder', () => {
  it('builds a context snapshot from todo and GitHub sources', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([
      {
        id: 1,
        title: 'Ship refactor',
        description: '',
        priority: 'high',
        status: 'done',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    vi.mocked(githubToolsApi.getCollection).mockResolvedValue([
      {
        id: 1,
        toolId: 1,
        status: 'deep_use',
        isHidden: false,
        statusChangedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        tool: {
          id: 1,
          name: 'cc-tool',
          fullName: 'team/cc-tool',
          url: 'https://github.com/team/cc-tool',
          description: 'Helpful tool',
          stars: 100,
          language: 'TypeScript',
          fetchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      },
    ]);

    const context = await buildConversationContext();
    const messages = buildLlmMessages([
      { id: '1', role: 'user', content: '现在进展如何？', timestamp: new Date().toISOString() },
    ], context);

    expect(context.content).toContain('Ship refactor [已完成]');
    expect(context.content).toContain('cc-tool: Helpful tool');
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });
});
