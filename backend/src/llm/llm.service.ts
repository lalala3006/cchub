import { Injectable } from '@nestjs/common';
import { SystemConfigService } from '../system-config/system-config.service';

interface ChatMessage {
  role: string;
  content: string;
}

interface Tool {
  fullName: string;
  description?: string;
  language?: string;
  stars: number;
}

interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

interface LlmApiResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class LlmService {
  constructor(
    private systemConfigService: SystemConfigService,
  ) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    // 1. 从 SystemConfigService 获取 LLM 配置
    const config: LlmConfig = await this.systemConfigService.getRawLlmConfig();

    // 2. 调用 LLM API（使用 fetch，带 30 秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM API 请求超时（30秒）');
      }
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API 调用失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: LlmApiResponse = await response.json();

    // 3. 返回 assistant 的回复文本（带响应验证）
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error(`Invalid LLM API response: ${JSON.stringify(data)}`);
    }
    return data.choices[0].message.content;
  }

  async summarizeTool(tool: Tool): Promise<string> {
    // 使用 chat 方法，发送总结请求
    const prompt = `请用中文总结以下 GitHub 项目，50 字以内：\n\n项目名：${tool.fullName}\n描述：${tool.description || '无'}\n语言：${tool.language}\nStar 数：${tool.stars}`;
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages);
  }
}
