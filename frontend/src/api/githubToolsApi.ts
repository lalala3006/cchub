import { apiRequest, apiRequestVoid, API_BASE_URL } from './client';

export type CollectionStatus = 'unread' | 'practiced' | 'deep_use' | 'no_longer_used';

export interface GithubTool {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string;
  descriptionCn?: string;
  stars: number;
  language: string;
  avatarUrl?: string;
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
    return apiRequest<GithubTool[]>('/github-tools/feed');
  },

  // 获取收藏列表
  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const query = params.toString();
    return apiRequest<CollectionRecord[]>(`/github-tools/collection${query ? `?${query}` : ''}`);
  },

  // 保留
  async keepTool(toolId: number): Promise<CollectionRecord> {
    return apiRequest<CollectionRecord>(`/github-tools/collection/${toolId}/keep`, { method: 'POST' });
  },

  // 隐藏
  async hideTool(toolId: number): Promise<void> {
    await apiRequestVoid(`/github-tools/collection/${toolId}/hide`, { method: 'POST' });
  },

  // 更新状态
  async updateStatus(toolId: number, status: CollectionStatus): Promise<CollectionRecord> {
    return apiRequest<CollectionRecord>(`/github-tools/collection/${toolId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // 配置
  async getConfig(): Promise<FocusConfig[]> {
    return apiRequest<FocusConfig[]>('/github-tools/config');
  },

  async createConfig(keyword: string, weight: number): Promise<FocusConfig> {
    return apiRequest<FocusConfig>('/github-tools/config', {
      method: 'POST',
      body: JSON.stringify({ keyword, weight }),
    });
  },

  async deleteConfig(id: number): Promise<void> {
    await apiRequestVoid(`/github-tools/config/${id}`, { method: 'DELETE' });
  },

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    return apiRequest<FocusConfig>(`/github-tools/config/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ weight }),
    });
  },

  // 触发抓取
  async triggerFetch(): Promise<void> {
    await apiRequestVoid('/github-tools/fetch', { method: 'POST' });
  },
};

export { API_BASE_URL };
