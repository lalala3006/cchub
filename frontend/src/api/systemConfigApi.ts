const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

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

export const systemConfigApi = {
  async getLlmConfig(): Promise<LlmConfig> {
    return handleResponse(await fetch(`${API_BASE_URL}/system-config/llm`));
  },

  async updateLlmConfig(config: Partial<LlmConfig>): Promise<void> {
    await handleVoidResponse(await fetch(`${API_BASE_URL}/system-config/llm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }));
  },
};
