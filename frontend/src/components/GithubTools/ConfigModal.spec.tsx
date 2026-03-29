import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigModal } from './ConfigModal';
import type { FocusConfig } from '../../api/githubToolsApi';

vi.mock('../../api/githubToolsApi', async () => {
  const actual = await vi.importActual('../../api/githubToolsApi');
  return {
    ...actual,
    githubToolsApi: {
      getConfig: vi.fn(),
      createConfig: vi.fn(),
      deleteConfig: vi.fn(),
      updateConfig: vi.fn(),
    },
  };
});

import { githubToolsApi } from '../../api/githubToolsApi';

describe('ConfigModal', () => {
  const mockConfigs: FocusConfig[] = [
    { id: 1, keyword: 'AI', weight: 8, createdAt: '2026-03-29T00:00:00Z' },
    { id: 2, keyword: 'cli-tool', weight: 5, createdAt: '2026-03-29T00:00:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  describe('FM-001 to FM-002: Initial load', () => {
    it('FM-001: loads configs when modal opens', async () => {
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfigs);

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(githubToolsApi.getConfig).toHaveBeenCalled();
      });
    });

    it('FM-002: does not load configs when modal is closed', async () => {
      render(<ConfigModal open={false} onClose={vi.fn()} />);

      expect(githubToolsApi.getConfig).not.toHaveBeenCalled();
    });
  });

  describe('FM-003 to FM-005: Config list rendering', () => {
    it('FM-003: renders config list when configs exist', async () => {
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfigs);

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('AI')).toBeInTheDocument();
        expect(screen.getByText('cli-tool')).toBeInTheDocument();
      });
    });

    it('FM-004: displays weight values', async () => {
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfigs);

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const weightDisplays = screen.getAllByText((content) => content.match(/^[58]$/));
        expect(weightDisplays.length).toBeGreaterThan(0);
      });
    });

    it('FM-005: shows empty state when no configs', async () => {
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('暂无配置，点击上方添加')).toBeInTheDocument();
      });
    });
  });

  describe('FM-006 to FM-007: Add config operation', () => {
    it('FM-006: creates config with keyword and weight', async () => {
      (githubToolsApi.createConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3, keyword: 'new', weight: 7, createdAt: '' });
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      const input = screen.getByPlaceholderText('输入关键词，如: AI, low-code, cli-tool');
      fireEvent.change(input, { target: { value: 'new-tool' } });

      const addBtn = screen.getByText('添加');
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(githubToolsApi.createConfig).toHaveBeenCalledWith('new-tool', 5);
      });
    });

    it('FM-007: does not add empty keyword', async () => {
      (githubToolsApi.createConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3, keyword: '', weight: 5, createdAt: '' });

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      const addBtn = screen.getByText('添加');
      fireEvent.click(addBtn);

      expect(githubToolsApi.createConfig).not.toHaveBeenCalled();
    });
  });

  describe('FM-008: Delete operation', () => {
    it('FM-008: deletes config when delete button is clicked', async () => {
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfigs);
      (githubToolsApi.deleteConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('AI')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByText('删除');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(githubToolsApi.deleteConfig).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('FM-009: Loading state', () => {
    it('FM-009: shows loading state while fetching', () => {
      (githubToolsApi.getConfig as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      render(<ConfigModal open={true} onClose={vi.fn()} />);

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });
});
