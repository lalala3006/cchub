export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

async function handleVoidResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

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
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/feed`));
  },

  // 获取收藏列表
  async getCollection(status?: CollectionStatus, search?: string): Promise<CollectionRecord[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/collection?${params}`));
  },

  // 保留
  async keepTool(toolId: number): Promise<CollectionRecord> {
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/collection/${toolId}/keep`, { method: 'POST' }));
  },

  // 隐藏
  async hideTool(toolId: number): Promise<void> {
    await handleVoidResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/collection/${toolId}/hide`, { method: 'POST' }));
  },

  // 更新状态
  async updateStatus(toolId: number, status: CollectionStatus): Promise<CollectionRecord> {
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/collection/${toolId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }));
  },

  // 配置
  async getConfig(): Promise<FocusConfig[]> {
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/config`));
  },

  async createConfig(keyword: string, weight: number): Promise<FocusConfig> {
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, weight }),
    }));
  },

  async deleteConfig(id: number): Promise<void> {
    await handleVoidResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/config/${id}`, { method: 'DELETE' }));
  },

  async updateConfig(id: number, weight: number): Promise<FocusConfig> {
    return handleResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/config/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight }),
    }));
  },

  // 触发抓取
  async triggerFetch(): Promise<void> {
    await handleVoidResponse(await fetchWithAuth(`${API_BASE_URL}/github-tools/fetch`, { method: 'POST' }));
  },
};
