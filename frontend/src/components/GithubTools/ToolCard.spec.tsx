import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToolCard } from './ToolCard';

describe('ToolCard', () => {
  it('prevents default navigation when keep button is clicked', () => {
    const onKeep = vi.fn();

    render(
      <ToolCard
        mode="feed"
        tool={{
          id: 1,
          name: 'cc-tool',
          fullName: 'team/cc-tool',
          url: 'https://github.com/team/cc-tool',
          description: 'tool description',
          stars: 42,
          language: 'TypeScript',
          fetchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }}
        onKeep={onKeep}
      />,
    );

    const button = screen.getByRole('button', { name: '保留' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onKeep).toHaveBeenCalledWith(1);
  });

  it('renders next collection status action', () => {
    const onStatusChange = vi.fn();

    render(
      <ToolCard
        mode="collection"
        tool={{
          id: 1,
          toolId: 1,
          status: 'practiced',
          isHidden: false,
          statusChangedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          tool: {
            id: 1,
            name: 'cc-tool',
            fullName: 'team/cc-tool',
            url: 'https://github.com/team/cc-tool',
            description: 'tool description',
            stars: 42,
            language: 'TypeScript',
            fetchedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        }}
        onStatusChange={onStatusChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '标记为深度使用' }));
    expect(onStatusChange).toHaveBeenCalledWith(1, 'deep_use');
  });
});
