import { apiRequest, apiRequestVoid, API_BASE_URL } from './client';

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export const systemConfigApi = {
  async getLlmConfig(): Promise<LlmConfig> {
    return apiRequest<LlmConfig>('/system-config/llm');
  },

  async updateLlmConfig(config: Partial<LlmConfig>): Promise<void> {
    await apiRequestVoid('/system-config/llm', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },
};

export { API_BASE_URL };
