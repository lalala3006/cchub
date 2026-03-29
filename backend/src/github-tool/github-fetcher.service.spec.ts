import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GithubFetcherService } from './github-fetcher.service';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';

// Mock the fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GithubFetcherService', () => {
  let service: GithubFetcherService;
  let toolRepo: jest.Mocked<Repository<GithubTool>>;
  let recordRepo: jest.Mocked<Repository<CollectionRecord>>;
  let configRepo: jest.Mocked<Repository<FocusConfig>>;

  const mockTool: GithubTool = {
    id: 1,
    name: 'test-tool',
    fullName: 'owner/test-tool',
    url: 'https://github.com/owner/test-tool',
    description: 'A test tool',
    stars: 100,
    language: 'TypeScript',
    fetchedAt: new Date(),
    createdAt: new Date(),
    collectionRecord: [],
    avatarUrl: 'https://github.com/favicon.ico',
    descriptionCn: '中文描述',
  };

  const mockConfig: FocusConfig = {
    id: 1,
    keyword: 'nestjs',
    weight: 5,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubFetcherService,
        {
          provide: getRepositoryToken(GithubTool),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CollectionRecord),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FocusConfig),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GithubFetcherService>(GithubFetcherService);
    toolRepo = module.get(getRepositoryToken(GithubTool));
    recordRepo = module.get(getRepositoryToken(CollectionRecord));
    configRepo = module.get(getRepositoryToken(FocusConfig));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAndSaveTools', () => {
    it('BF-001: should skip fetch when no configs exist', async () => {
      configRepo.find.mockResolvedValue([]);

      await service.fetchAndSaveTools();

      expect(configRepo.find).toHaveBeenCalledWith({ order: { weight: 'DESC' } });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('BF-002: should allocate quota based on weight', async () => {
      const configs = [
        { ...mockConfig, id: 1, keyword: 'nestjs', weight: 8 },
        { ...mockConfig, id: 2, keyword: 'react', weight: 2 },
      ];
      configRepo.find.mockResolvedValue(configs);
      toolRepo.find.mockResolvedValue([]);
      toolRepo.findOne.mockResolvedValue(null);
      toolRepo.save.mockResolvedValue(mockTool);
      recordRepo.create.mockReturnValue({} as CollectionRecord);
      recordRepo.save.mockResolvedValue({} as CollectionRecord);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: [
            {
              full_name: 'owner/test-tool',
              html_url: 'https://github.com/owner/test-tool',
              description: 'A test tool',
              stargazers_count: 100,
              language: 'TypeScript',
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await service.fetchAndSaveTools();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('BF-003: should filter out existing tools by fullName', async () => {
      configRepo.find.mockResolvedValue([mockConfig]);
      toolRepo.find.mockResolvedValue([{ fullName: 'owner/existing-tool', name: 'existing-tool', url: 'https://github.com/owner/existing-tool', fetchedAt: new Date() } as GithubTool]);
      toolRepo.findOne.mockResolvedValue(null);
      toolRepo.save.mockResolvedValue(mockTool);
      recordRepo.create.mockReturnValue({} as CollectionRecord);
      recordRepo.save.mockResolvedValue({} as CollectionRecord);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: [
            {
              full_name: 'owner/test-tool',
              html_url: 'https://github.com/owner/test-tool',
              description: 'A test tool',
              stargazers_count: 100,
              language: 'TypeScript',
            },
            {
              full_name: 'owner/existing-tool',
              html_url: 'https://github.com/owner/existing-tool',
              description: 'Already exists',
              stargazers_count: 50,
              language: 'JavaScript',
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await service.fetchAndSaveTools();

      const savedTool = toolRepo.save.mock.calls[0][0] as GithubTool;
      expect(savedTool.fullName).toBe('owner/test-tool');
    });

    it('BF-004: should handle API rate limit gracefully', async () => {
      configRepo.find.mockResolvedValue([mockConfig]);
      toolRepo.find.mockResolvedValue([]);

      const mockResponse = {
        ok: false,
        status: 403,
      };
      mockFetch.mockResolvedValue(mockResponse);

      await service.fetchAndSaveTools();

      expect(toolRepo.save).not.toHaveBeenCalled();
    });

    it('BF-005: should auto-create collection record when saving tool', async () => {
      configRepo.find.mockResolvedValue([mockConfig]);
      toolRepo.find.mockResolvedValue([]);
      toolRepo.findOne.mockResolvedValue(null);
      toolRepo.save.mockResolvedValue({ ...mockTool, id: 1 });
      recordRepo.save.mockResolvedValue({} as CollectionRecord);

      // Mock fetchByKeyword to return a tool directly
      jest.spyOn(service as any, 'fetchByKeyword').mockResolvedValue([mockTool]);
      // Mock fetchFavicon to prevent actual HTTP call
      jest.spyOn(service as any, 'fetchFavicon').mockResolvedValue('https://github.com/favicon.ico');

      await service.fetchAndSaveTools();

      expect(recordRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          toolId: 1,
          isHidden: false,
        }),
      );
    });

    it('should not save duplicate tools', async () => {
      configRepo.find.mockResolvedValue([mockConfig]);
      toolRepo.find.mockResolvedValue([]);
      toolRepo.findOne.mockResolvedValue({ ...mockTool, id: 1, fullName: 'owner/test-tool' });
      toolRepo.save.mockResolvedValue(mockTool);
      recordRepo.create.mockReturnValue({} as CollectionRecord);
      recordRepo.save.mockResolvedValue({} as CollectionRecord);

      // Mock fetch for GitHub search API and favicon page
      const searchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: [
            {
              full_name: 'owner/test-tool',
              html_url: 'https://github.com/owner/test-tool',
              description: 'A test tool',
              stargazers_count: 100,
              language: 'TypeScript',
            },
          ],
        }),
      };
      const faviconResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('<html><link rel="icon" href="/favicon.ico"></html>'),
      };
      mockFetch
        .mockResolvedValueOnce(searchResponse)
        .mockResolvedValueOnce(faviconResponse);

      await service.fetchAndSaveTools();

      // Duplicate exists, so save should NOT be called
      expect(toolRepo.save).not.toHaveBeenCalled();
    });

    it('should limit saved tools to 10', async () => {
      const manyConfigs = Array(15).fill(null).map((_, i) => ({
        ...mockConfig,
        id: i,
        keyword: `keyword${i}`,
        weight: 1,
      }));
      configRepo.find.mockResolvedValue(manyConfigs);
      toolRepo.find.mockResolvedValue([]);
      toolRepo.findOne.mockResolvedValue(null);
      toolRepo.save.mockResolvedValue(mockTool);
      recordRepo.create.mockReturnValue({} as CollectionRecord);
      recordRepo.save.mockResolvedValue({} as CollectionRecord);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: [
            {
              full_name: `owner/tool${Math.random()}`,
              html_url: 'https://github.com/owner/test-tool',
              description: 'A test tool',
              stargazers_count: 100,
              language: 'TypeScript',
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await service.fetchAndSaveTools();

      expect(toolRepo.save).toHaveBeenCalledTimes(10);
    });
  });

  describe('fetchWeekly', () => {
    it('should call fetchAndSaveTools on cron execution', async () => {
      configRepo.find.mockResolvedValue([mockConfig]);
      toolRepo.find.mockResolvedValue([]);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ items: [] }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await service.fetchWeekly();

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});