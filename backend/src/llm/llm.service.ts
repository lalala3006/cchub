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

@Injectable()
export class LlmService {
  constructor(
    private systemConfigService: SystemConfigService,
  ) {}

  async chat(messages: ChatMessage[]): Promise<string> {
    const config = await this.systemConfigService.getRawLlmConfig();

    // 判断是 Anthropic 格式还是 OpenAI 格式
    const isAnthropicFormat = config.apiUrl.includes('anthropic');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      if (isAnthropicFormat) {
        // Anthropic/MiniMax 格式
        response = await fetch(`${config.apiUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        });
      } else {
        // OpenAI 格式
        response = await fetch(`${config.apiUrl}/chat/completions`, {
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
      }
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
      throw new Error(`LLM API 调用失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 解析响应
    if (isAnthropicFormat) {
      const textBlock = data.content?.find((block: any) => block.type === 'text');
      return textBlock?.text || '抱歉，没有得到有效回复。';
    } else {
      return data.choices?.[0]?.message?.content || '抱歉，没有得到有效回复。';
    }
  }

  async summarizeTool(tool: Tool): Promise<string> {
    const prompt = `请用中文总结以下 GitHub 项目，50 字以内：\n\n项目名：${tool.fullName}\n描述：${tool.description || '无'}\n语言：${tool.language}\nStar 数：${tool.stars}`;
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages);
  }
}
