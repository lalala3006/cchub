import type { GithubTool, CollectionRecord, CollectionStatus } from '../../api/githubToolsApi';
import styles from './GithubToolsPage.module.css';

const isValidHttpUrl = (url: string): boolean => {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
};

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

  const avatarSrc = actualTool.avatarUrl && isValidHttpUrl(actualTool.avatarUrl)
    ? actualTool.avatarUrl
    : `/languages/${actualTool.language?.toLowerCase()}.svg`;

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

  const statusClass = status === 'practiced' ? styles.practiced :
                      status === 'deep_use' ? styles.deepUse : '';

  return (
    <a href={actualTool.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <img
              src={avatarSrc}
              alt={actualTool.name}
              className={styles.avatar}
              onError={(e) => {
                e.currentTarget.src = `/languages/${actualTool.language?.toLowerCase()}.svg`;
              }}
            />
            <span className={styles.cardTitle}>{actualTool.name}</span>
          </div>
        </div>
        <div className={styles.meta}>
          {status && (
            <span className={`${styles.badge} ${styles.badgeStatus} ${statusClass ? styles[statusClass] : ''}`}>
              {statusLabels[status]}
            </span>
          )}
          <span className={`${styles.badge} ${styles.badgeStars}`}>
            {actualTool.stars.toLocaleString()} ⭐
          </span>
          {actualTool.language && (
            <span className={`${styles.badge} ${styles.badgeLanguage}`}>
              {actualTool.language}
            </span>
          )}
        </div>
        <p className={styles.description}>
          {actualTool.description || '暂无描述'}
        </p>

        <div className={styles.cardFooter}>
          {mode === 'feed' && (
            <div className={styles.actions}>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={() => onKeep?.(actualTool.id)}
              >
                保留
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={() => onHide?.(actualTool.id)}
              >
                不感兴趣
              </button>
            </div>
          )}
          {mode === 'collection' && status && nextStatusMap[status] && (
            <div className={styles.actions}>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={() => onStatusChange?.(actualTool.id, nextStatusMap[status]!)}
              >
                标记为{statusLabels[nextStatusMap[status]!]}
              </button>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
