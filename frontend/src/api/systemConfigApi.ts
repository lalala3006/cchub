const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export const systemConfigApi = {
  async getLlmConfig(): Promise<LlmConfig> {
    const res = await fetch(`${API_BASE_URL}/system-config/llm`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateLlmConfig(config: Partial<LlmConfig>): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/system-config/llm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
};