import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GithubToolsPage } from './GithubToolsPage';
import type { GithubTool, CollectionRecord } from '../api/githubToolsApi';

vi.mock('../api/githubToolsApi', async () => {
  const actual = await vi.importActual('../api/githubToolsApi');
  return {
    ...actual,
    githubToolsApi: {
      getFeed: vi.fn(),
      getCollection: vi.fn(),
      keepTool: vi.fn(),
      hideTool: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
});

import { githubToolsApi } from '../api/githubToolsApi';

describe('GithubToolsPage', () => {
  const mockTool: GithubTool = {
    id: 1,
    name: 'test-repo',
    fullName: 'org/test-repo',
    url: 'https://github.com/org/test-repo',
    description: 'A test repository',
    stars: 1000,
    language: 'TypeScript',
    fetchedAt: '2026-03-29T00:00:00Z',
    createdAt: '2026-03-29T00:00:00Z',
  };

  const mockCollectionRecord: CollectionRecord = {
    id: 1,
    toolId: 1,
    tool: mockTool,
    status: 'practiced',
    isHidden: false,
    statusChangedAt: '2026-03-29T00:00:00Z',
    createdAt: '2026-03-29T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (githubToolsApi.getFeed as ReturnType<typeof vi.fn>).mockResolvedValue([mockTool]);
    (githubToolsApi.getCollection as ReturnType<typeof vi.fn>).mockResolvedValue([mockCollectionRecord]);
    (githubToolsApi.keepTool as ReturnType<typeof vi.fn>).mockResolvedValue(mockCollectionRecord);
    (githubToolsApi.hideTool as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (githubToolsApi.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockCollectionRecord);
  });

  describe('FP-001 to FP-003: Initial load', () => {
    it('FP-001: loads feed on initial render', async () => {
      render(<GithubToolsPage />);

      await waitFor(() => {
        expect(githubToolsApi.getFeed).toHaveBeenCalled();
      });
    });

    it('FP-002: displays feed items in unread tab', async () => {
      render(<GithubToolsPage />);

      await waitFor(() => {
        expect(screen.getByText('test-repo')).toBeInTheDocument();
      });
    });

    it('FP-003: shows loading state while loading', () => {
      (githubToolsApi.getFeed as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      render(<GithubToolsPage />);

      const spinElement = document.querySelector('.ant-spin');
      expect(spinElement).toBeInTheDocument();
    });
  });

  describe('FP-004 to FP-006: Tab switching', () => {
    it('FP-004: switches to practiced tab when clicked', async () => {
      render(<GithubToolsPage />);

      const practicedTab = screen.getByText('已实践');
      await act(async () => {
        fireEvent.click(practicedTab);
      });

      await waitFor(() => {
        expect(githubToolsApi.getCollection).toHaveBeenCalledWith('practiced', undefined);
      });
    });

    it('FP-005: switches to deep_use tab when clicked', async () => {
      render(<GithubToolsPage />);

      const deepUseTab = screen.getByText('深度使用');
      await act(async () => {
        fireEvent.click(deepUseTab);
      });

      await waitFor(() => {
        expect(githubToolsApi.getCollection).toHaveBeenCalledWith('deep_use', undefined);
      });
    });

    it('FP-006: displays collection items in collection tabs', async () => {
      render(<GithubToolsPage />);

      const practicedTab = screen.getByText('已实践');
      await act(async () => {
        fireEvent.click(practicedTab);
      });

      await waitFor(() => {
        expect(screen.getByText('test-repo')).toBeInTheDocument();
      });
    });
  });

  describe('FP-007 to FP-008: Search functionality', () => {
    it('FP-007: shows search input in collection tabs', async () => {
      render(<GithubToolsPage />);

      const practicedTab = screen.getByText('已实践');
      await act(async () => {
        fireEvent.click(practicedTab);
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('搜索项目名或描述...')).toBeInTheDocument();
      });
    });

    it('FP-008: calls getCollection with search term', async () => {
      render(<GithubToolsPage />);

      const practicedTab = screen.getByText('已实践');
      await act(async () => {
        fireEvent.click(practicedTab);
      });

      const searchInput = screen.getByPlaceholderText('搜索项目名或描述...');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'react' } });
      });

      await waitFor(() => {
        expect(githubToolsApi.getCollection).toHaveBeenCalledWith('practiced', 'react');
      });
    });
  });

  describe('FP-009 to FP-010: Operations', () => {
    it('FP-009: keepTool reloads feed and collection', async () => {
      render(<GithubToolsPage />);

      await waitFor(() => {
        expect(screen.getByText('test-repo')).toBeInTheDocument();
      });

      const keepBtn = screen.getByText('保留');
      await act(async () => {
        fireEvent.click(keepBtn);
      });

      await waitFor(() => {
        expect(githubToolsApi.keepTool).toHaveBeenCalledWith(1);
        expect(githubToolsApi.getFeed).toHaveBeenCalled();
      });
    });

    it('FP-010: hideTool reloads feed only', async () => {
      render(<GithubToolsPage />);

      await waitFor(() => {
        expect(screen.getByText('test-repo')).toBeInTheDocument();
      });

      const hideBtn = screen.getByText('不感兴趣');
      await act(async () => {
        fireEvent.click(hideBtn);
      });

      await waitFor(() => {
        expect(githubToolsApi.hideTool).toHaveBeenCalledWith(1);
        expect(githubToolsApi.getFeed).toHaveBeenCalled();
      });
    });
  });

  describe('Empty states', () => {
    it('shows empty state when collection is empty', async () => {
      (githubToolsApi.getCollection as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(<GithubToolsPage />);

      const practicedTab = screen.getByText('已实践');
      await act(async () => {
        fireEvent.click(practicedTab);
      });

      await waitFor(() => {
        expect(screen.getByText('暂无数据')).toBeInTheDocument();
      });
    });
  });
});
