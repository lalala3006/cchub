import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig) private configRepo: Repository<SystemConfig>,
  ) {}

  private maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 4) {
      return '***';
    }
    return apiKey.substring(0, 2) + '***' + apiKey.substring(apiKey.length - 2);
  }

  async getLlmConfig(): Promise<{ apiUrl: string; apiKey: string; model: string }> {
    const configs = await this.configRepo.find({ where: { category: 'llm' } });
    const configMap = new Map(configs.map(c => [c.key, c.value]));

    const apiKey = configMap.get('llm_api_key') || '';
    return {
      apiUrl: configMap.get('llm_api_url') || '',
      apiKey: this.maskApiKey(apiKey),
      model: configMap.get('llm_model') || '',
    };
  }

  async getRawLlmConfig(): Promise<{ apiUrl: string; apiKey: string; model: string }> {
    const configs = await this.findByCategory('llm');
    const configMap = new Map(configs.map(c => [c.key, c.value]));

    return {
      apiUrl: configMap.get('llm_api_url') || '',
      apiKey: configMap.get('llm_api_key') || '',
      model: configMap.get('llm_model') || '',
    };
  }

  async updateLlmConfig(updates: { apiUrl?: string; apiKey?: string; model?: string }): Promise<{ apiUrl: string; apiKey: string; model: string }> {
    const configsToUpsert: Partial<SystemConfig>[] = [];
    const currentConfig = await this.getRawLlmConfig();
    const maskedCurrentApiKey = this.maskApiKey(currentConfig.apiKey);

    if (updates.apiUrl !== undefined) {
      configsToUpsert.push({ key: 'llm_api_url', value: updates.apiUrl, category: 'llm' });
    }
    if (updates.apiKey !== undefined && updates.apiKey !== '' && updates.apiKey !== maskedCurrentApiKey) {
      configsToUpsert.push({ key: 'llm_api_key', value: updates.apiKey, category: 'llm' });
    }
    if (updates.model !== undefined) {
      configsToUpsert.push({ key: 'llm_model', value: updates.model, category: 'llm' });
    }

    // TypeORM's upsert() supports batch operations natively
    if (configsToUpsert.length > 0) {
      await this.configRepo.upsert(configsToUpsert, ['key']);
    }

    return this.getLlmConfig();
  }

  async findByKey(key: string): Promise<SystemConfig | null> {
    return this.configRepo.findOne({ where: { key } });
  }

  async findByCategory(category: string): Promise<SystemConfig[]> {
    return this.configRepo.find({ where: { category } });
  }

  async setConfig(key: string, value: string, category: string = 'llm'): Promise<SystemConfig> {
    let config = await this.configRepo.findOne({ where: { key } });
    if (config) {
      config.value = value;
      config.category = category;
      return this.configRepo.save(config);
    } else {
      config = this.configRepo.create({ key, value, category });
      return this.configRepo.save(config);
    }
  }
}
