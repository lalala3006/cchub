import { useState, useEffect } from 'react';
import { Spin, message } from 'antd';
import type { GithubTool, CollectionRecord, CollectionStatus } from '../api/githubToolsApi';
import { githubToolsApi } from '../api/githubToolsApi';
import { ToolCard } from '../components/GithubTools/ToolCard';
import styles from '../components/GithubTools/GithubToolsPage.module.css';

const TABS: { key: CollectionStatus; label: string }[] = [
  { key: 'unread', label: '未读' },
  { key: 'practiced', label: '已实践' },
  { key: 'deep_use', label: '深度使用' },
];

export function GithubToolsPage() {
  const [activeTab, setActiveTab] = useState<CollectionStatus>('unread');
  const [feed, setFeed] = useState<GithubTool[]>([]);
  const [collection, setCollection] = useState<CollectionRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    loadCollection();
  }, [activeTab, search]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const data = await githubToolsApi.getFeed();
      setFeed(data);
    } catch {
      message.error('加载推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCollection = async () => {
    setLoading(true);
    try {
      const data = await githubToolsApi.getCollection(activeTab, search || undefined);
      setCollection(data);
    } catch {
      message.error('加载收藏失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeep = async (toolId: number) => {
    try {
      await githubToolsApi.keepTool(toolId);
      message.success('已保留');
      loadFeed();
      loadCollection();
    } catch {
      message.error('操作失败');
    }
  };

  const handleHide = async (toolId: number) => {
    try {
      await githubToolsApi.hideTool(toolId);
      message.success('已隐藏');
      loadFeed();
    } catch {
      message.error('操作失败');
    }
  };

  const handleStatusChange = async (toolId: number, status: CollectionStatus) => {
    try {
      await githubToolsApi.updateStatus(toolId, status);
      message.success('状态已更新');
      loadCollection();
    } catch {
      message.error('操作失败');
    }
  };

  const showCollection = activeTab === 'practiced' || activeTab === 'deep_use';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>GitHub 工具</h1>
          <p className={styles.subtitle}>发现和追踪有价值的开源项目</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <div className={styles.tabList}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {showCollection && (
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.search}
            placeholder="搜索项目名或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <Spin spinning={loading}>
        <div className={styles.list}>
          {activeTab === 'unread' && feed.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              mode="feed"
              onKeep={handleKeep}
              onHide={handleHide}
            />
          ))}
          {showCollection && collection.map((record) => (
            <ToolCard
              key={record.id}
              tool={record}
              mode="collection"
              onStatusChange={handleStatusChange}
            />
          ))}
          {showCollection && collection.length === 0 && (
            <div className={styles.empty}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>暂无数据</p>
            </div>
          )}
        </div>
      </Spin>
    </div>
  );
}
