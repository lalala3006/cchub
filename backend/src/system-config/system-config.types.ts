export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface LlmConfigUpdate {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}
