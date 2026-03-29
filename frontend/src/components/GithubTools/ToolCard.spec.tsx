import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCard } from './ToolCard';
import type { GithubTool, CollectionRecord } from '../../api/githubToolsApi';

describe('ToolCard', () => {
  const mockTool: GithubTool = {
    id: 1,
    name: 'test-repo',
    fullName: 'org/test-repo',
    url: 'https://github.com/org/test-repo',
    description: 'A test repository description',
    stars: 1500,
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

  describe('FC-001 to FC-003: Tool information display', () => {
    it('FC-001: displays tool name correctly', () => {
      render(<ToolCard tool={mockTool} mode="feed" />);
      expect(screen.getByText('test-repo')).toBeInTheDocument();
    });

    it('FC-002: displays star count correctly', () => {
      render(<ToolCard tool={mockTool} mode="feed" />);
      expect(screen.getByText('1,500 ⭐')).toBeInTheDocument();
    });

    it('FC-003: displays language tag', () => {
      render(<ToolCard tool={mockTool} mode="feed" />);
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('FC-003: does not display language when null', () => {
      const toolWithoutLang = { ...mockTool, language: '' };
      render(<ToolCard tool={toolWithoutLang} mode="feed" />);
      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    });
  });

  describe('FC-004 to FC-006: Feed mode buttons', () => {
    it('FC-004: shows Keep and Not Interested buttons in feed mode', () => {
      render(<ToolCard tool={mockTool} mode="feed" />);
      expect(screen.getByText('保留')).toBeInTheDocument();
      expect(screen.getByText('不感兴趣')).toBeInTheDocument();
    });

    it('FC-005: calls onKeep with toolId when Keep button is clicked', () => {
      const onKeep = vi.fn();
      render(<ToolCard tool={mockTool} mode="feed" onKeep={onKeep} />);
      fireEvent.click(screen.getByText('保留'));
      expect(onKeep).toHaveBeenCalledWith(1);
    });

    it('FC-006: calls onHide with toolId when Not Interested button is clicked', () => {
      const onHide = vi.fn();
      render(<ToolCard tool={mockTool} mode="feed" onHide={onHide} />);
      fireEvent.click(screen.getByText('不感兴趣'));
      expect(onHide).toHaveBeenCalledWith(1);
    });
  });

  describe('FC-007 to FC-009: Collection mode buttons', () => {
    it('FC-007: shows status badge for collection mode', () => {
      render(<ToolCard tool={mockCollectionRecord} mode="collection" />);
      expect(screen.getByText('已实践')).toBeInTheDocument();
    });

    it('FC-008: shows next status button for practiced status', () => {
      render(<ToolCard tool={mockCollectionRecord} mode="collection" />);
      expect(screen.getByText('标记为深度使用')).toBeInTheDocument();
    });

    it('FC-009: calls onStatusChange with correct status', () => {
      const onStatusChange = vi.fn();
      render(
        <ToolCard
          tool={mockCollectionRecord}
          mode="collection"
          onStatusChange={onStatusChange}
        />
      );
      fireEvent.click(screen.getByText('标记为深度使用'));
      expect(onStatusChange).toHaveBeenCalledWith(1, 'deep_use');
    });
  });

  describe('FC-010: Link attributes', () => {
    it('FC-010: link has correct target and rel attributes', () => {
      render(<ToolCard tool={mockTool} mode="feed" />);
      const link = screen.getByText('test-repo');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Description handling', () => {
    it('displays default text when description is empty', () => {
      const toolWithoutDesc = { ...mockTool, description: '' };
      render(<ToolCard tool={toolWithoutDesc} mode="feed" />);
      expect(screen.getByText('暂无描述')).toBeInTheDocument();
    });

    it('displays description when provided', () => {
      render(<ToolCard tool={mockTool} mode="feed" />);
      expect(screen.getByText('A test repository description')).toBeInTheDocument();
    });
  });
});
