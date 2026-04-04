import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import { SYSTEM_CONFIG_CATEGORY_LLM, SYSTEM_CONFIG_KEYS } from './system-config.keys';
import { LlmConfig, LlmConfigUpdate } from './system-config.types';

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

  async getLlmConfig(): Promise<LlmConfig> {
    const configs = await this.configRepo.find({ where: { category: SYSTEM_CONFIG_CATEGORY_LLM } });
    const configMap = new Map(configs.map(c => [c.key, c.value]));

    const apiKey = configMap.get(SYSTEM_CONFIG_KEYS.llmApiKey) || '';
    return {
      apiUrl: configMap.get(SYSTEM_CONFIG_KEYS.llmApiUrl) || '',
      apiKey: this.maskApiKey(apiKey),
      model: configMap.get(SYSTEM_CONFIG_KEYS.llmModel) || '',
    };
  }

  async getRawLlmConfig(): Promise<LlmConfig> {
    const configs = await this.findByCategory(SYSTEM_CONFIG_CATEGORY_LLM);
    const configMap = new Map(configs.map(c => [c.key, c.value]));

    return {
      apiUrl: configMap.get(SYSTEM_CONFIG_KEYS.llmApiUrl) || '',
      apiKey: configMap.get(SYSTEM_CONFIG_KEYS.llmApiKey) || '',
      model: configMap.get(SYSTEM_CONFIG_KEYS.llmModel) || '',
    };
  }

  async updateLlmConfig(updates: LlmConfigUpdate): Promise<LlmConfig> {
    const configsToUpsert: Partial<SystemConfig>[] = [];
    const currentConfig = await this.getRawLlmConfig();
    const maskedCurrentApiKey = this.maskApiKey(currentConfig.apiKey);

    if (updates.apiUrl !== undefined) {
      configsToUpsert.push({ key: SYSTEM_CONFIG_KEYS.llmApiUrl, value: updates.apiUrl, category: SYSTEM_CONFIG_CATEGORY_LLM });
    }
    if (updates.apiKey !== undefined && updates.apiKey !== '' && updates.apiKey !== maskedCurrentApiKey) {
      configsToUpsert.push({ key: SYSTEM_CONFIG_KEYS.llmApiKey, value: updates.apiKey, category: SYSTEM_CONFIG_CATEGORY_LLM });
    }
    if (updates.model !== undefined) {
      configsToUpsert.push({ key: SYSTEM_CONFIG_KEYS.llmModel, value: updates.model, category: SYSTEM_CONFIG_CATEGORY_LLM });
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

  async setConfig(key: string, value: string, category: string = SYSTEM_CONFIG_CATEGORY_LLM): Promise<SystemConfig> {
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
