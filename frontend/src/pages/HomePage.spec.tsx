import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';
import { todoApi } from '../api/todoApi';
import { githubToolsApi, API_BASE_URL } from '../api/githubToolsApi';

vi.mock('../api/todoApi', async () => {
  const actual = await vi.importActual<typeof import('../api/todoApi')>('../api/todoApi');
  return {
    ...actual,
    todoApi: {
      ...actual.todoApi,
      getAll: vi.fn(),
    },
  };
});

vi.mock('../api/githubToolsApi', async () => {
  const actual = await vi.importActual<typeof import('../api/githubToolsApi')>('../api/githubToolsApi');
  return {
    ...actual,
    githubToolsApi: {
      ...actual.githubToolsApi,
      getCollection: vi.fn(),
    },
  };
});

describe('HomePage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('builds assistant context from todos and deep-use tools before calling llm', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([
      {
        id: 1,
        title: 'Ship tests',
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

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ reply: '总结完成' }),
    } as unknown as Response);

    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText('输入你的问题...'), {
      target: { value: '现在进展如何？' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/llm/chat`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('## TODO 列表'),
        }),
      );
    });

    const [, request] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(request).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(String(request?.body)).toContain('Ship tests [已完成]');
    expect(String(request?.body)).toContain('cc-tool: Helpful tool');
    expect(await screen.findByText('总结完成')).toBeInTheDocument();
  });
});
