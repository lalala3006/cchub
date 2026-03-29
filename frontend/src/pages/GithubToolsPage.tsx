import { useState, useEffect } from 'react';
import { Tabs, Input, Spin, message, Empty } from 'antd';
import type { GithubTool, CollectionRecord, CollectionStatus } from '../api/githubToolsApi';
import { githubToolsApi } from '../api/githubToolsApi';
import { ToolCard } from '../components/GithubTools/ToolCard';
import styles from '../components/GithubTools/GithubToolsPage.module.css';

const { Search } = Input;

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

  return (
    <div className={styles.page}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as CollectionStatus)}
        items={[
          { key: 'unread', label: '未读', children: (
            <Search placeholder="搜索项目名或描述" onSearch={setSearch} enterButton allowClear />
          )},
          { key: 'practiced', label: '已实践', children: (
            <Search placeholder="搜索项目名或描述" onSearch={setSearch} enterButton allowClear />
          )},
          { key: 'deep_use', label: '深度使用', children: (
            <Search placeholder="搜索项目名或描述" onSearch={setSearch} enterButton allowClear />
          )},
        ]}
      />

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
          {(activeTab === 'practiced' || activeTab === 'deep_use') && collection.map((record) => (
            <ToolCard
              key={record.id}
              tool={record}
              mode="collection"
              onStatusChange={handleStatusChange}
            />
          ))}
          {((activeTab === 'practiced' || activeTab === 'deep_use') && collection.length === 0) && (
            <Empty description="暂无数据" />
          )}
        </div>
      </Spin>
    </div>
  );
}
