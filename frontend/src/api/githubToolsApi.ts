const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export type CollectionStatus = 'unread' | 'practiced' | 'deep_use' | 'no_longer_used';

export interface GithubTool {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  fetchedAt: string;
  createdAt: string;
}

export interface CollectionRecord {
  id: number;
  toolId: number;
  tool: GithubTool;
  status: CollectionStatus;
  isHidden: boolean;
  statusChangedAt: string;
  createdAt: string;
}

export interface FocusConfig {
  id: number;
  keyword: string;
  weight: number;
  createdAt: string;
}

export const githubToolsApi = {
  // 获取本周推荐
  async getFeed(): Promise<GithubTool[]> {
    const res = await fetch(`${API_BASE_URL}/github-tools/feed`);
    return res.json();
  },

  // 获取收藏列表
  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const res = await fetch(`${API_BASE_URL}/github-tools/collection?${params}`);
    return res.json();
  },

  // 保留
  async keepTool(toolId: number): Promise<CollectionRecord> {
    const res = await fetch(`${API_BASE_URL}/github-tools/collection/${toolId}/keep`, { method: 'POST' });
    return res.json();
  },

  // 隐藏
  async hideTool(toolId: number): Promise<void> {
    await fetch(`${API_BASE_URL}/github-tools/collection/${toolId}/hide`, { method: 'POST' });
  },

  // 更新状态
  async updateStatus(toolId: number, status: CollectionStatus): Promise<CollectionRecord> {
    const res = await fetch(`${API_BASE_URL}/github-tools/collection/${toolId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // 配置
  async getConfig(): Promise<FocusConfig[]> {
    const res = await fetch(`${API_BASE_URL}/github-tools/config`);
    return res.json();
  },

  async createConfig(keyword: string, weight: number): Promise<FocusConfig> {
    const res = await fetch(`${API_BASE_URL}/github-tools/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, weight }),
    });
    return res.json();
  },

  async deleteConfig(id: number): Promise<void> {
    await fetch(`${API_BASE_URL}/github-tools/config/${id}`, { method: 'DELETE' });
  },

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    const res = await fetch(`${API_BASE_URL}/github-tools/config/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight }),
    });
    return res.json();
  },

  // 触发抓取
  async triggerFetch(): Promise<void> {
    await fetch(`${API_BASE_URL}/github-tools/fetch`, { method: 'POST' });
  },
};
