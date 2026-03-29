import { Card, Button, Tag, Space } from 'antd';
import type { GithubTool, CollectionRecord, CollectionStatus } from '../../api/githubToolsApi';
import styles from './ToolCard.module.css';

interface ToolCardProps {
  tool: GithubTool | CollectionRecord;
  mode: 'feed' | 'collection';
  onKeep?: (toolId: number) => void;
  onHide?: (toolId: number) => void;
  onStatusChange?: (toolId: number, status: CollectionStatus) => void;
}

export function ToolCard({ tool, mode, onKeep, onHide, onStatusChange }: ToolCardProps) {
  const actualTool = 'tool' in tool ? tool.tool : tool;
  const status = 'status' in tool ? tool.status : undefined;

  const statusLabels: Record<CollectionStatus, string> = {
    unread: '未读',
    practiced: '已实践',
    deep_use: '深度使用',
    no_longer_used: '不再使用',
  };

  const nextStatusMap: Partial<Record<CollectionStatus, CollectionStatus>> = {
    practiced: 'deep_use',
    deep_use: 'no_longer_used',
  };

  return (
    <Card className={styles.card} hoverable>
      <div className={styles.header}>
        <a href={actualTool.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
          {actualTool.name}
        </a>
        <Space>
          {status && <Tag>{statusLabels[status]}</Tag>}
          <Tag>{actualTool.stars.toLocaleString()} ⭐</Tag>
          {actualTool.language && <Tag color="blue">{actualTool.language}</Tag>}
        </Space>
      </div>
      <p className={styles.description}>{actualTool.description || '暂无描述'}</p>
      {mode === 'feed' && (
        <Space className={styles.actions}>
          <Button type="primary" onClick={() => onKeep?.(actualTool.id)}>
            保留
          </Button>
          <Button onClick={() => onHide?.(actualTool.id)}>不感兴趣</Button>
        </Space>
      )}
      {mode === 'collection' && status && nextStatusMap[status] && (
        <Space className={styles.actions}>
          <Button type="primary" onClick={() => onStatusChange?.(actualTool.id, nextStatusMap[status]!)}>
            标记为{statusLabels[nextStatusMap[status]!]}
          </Button>
        </Space>
      )}
    </Card>
  );
}
