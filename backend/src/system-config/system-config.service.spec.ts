import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfigService } from './system-config.service';
import { SystemConfig } from './system-config.entity';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let configRepo: jest.Mocked<Repository<SystemConfig>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: getRepositoryToken(SystemConfig),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            upsert: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SystemConfigService);
    configRepo = module.get(getRepositoryToken(SystemConfig));
  });

  it('masks stored API keys on read', async () => {
    configRepo.find.mockResolvedValue([
      { key: 'llm_api_url', value: 'https://api.example.com', category: 'llm' },
      { key: 'llm_api_key', value: 'sk-live-1234', category: 'llm' },
      { key: 'llm_model', value: 'gpt-test', category: 'llm' },
    ] as SystemConfig[]);

    const result = await service.getLlmConfig();

    expect(result.apiKey).toBe('sk***34');
  });

  it('does not overwrite a secret with its masked placeholder', async () => {
    configRepo.find.mockResolvedValue([
      { key: 'llm_api_url', value: 'https://api.example.com', category: 'llm' },
      { key: 'llm_api_key', value: 'sk-live-1234', category: 'llm' },
      { key: 'llm_model', value: 'gpt-test', category: 'llm' },
    ] as SystemConfig[]);

    await service.updateLlmConfig({
      apiUrl: 'https://api.changed.com',
      apiKey: 'sk***34',
    });

    expect(configRepo.upsert).toHaveBeenCalledWith([
      { key: 'llm_api_url', value: 'https://api.changed.com', category: 'llm' },
    ], ['key']);
  });
});
