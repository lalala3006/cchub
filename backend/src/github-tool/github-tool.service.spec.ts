import { Test, TestingModule } from '@nestjs/testing';
import { GithubToolService } from './github-tool.service';
import { CollectionStatus } from './entities/collection-record.entity';
import { GithubFeedService } from './services/github-feed.service';
import { GithubWorkflowService } from './services/github-workflow.service';
import { GithubConfigService } from './services/github-config.service';

describe('GithubToolService', () => {
  let service: GithubToolService;
  let feedService: jest.Mocked<GithubFeedService>;
  let workflowService: jest.Mocked<GithubWorkflowService>;
  let configService: jest.Mocked<GithubConfigService>;

  const mockTool = {
    id: 1,
    name: 'test-tool',
    fullName: 'owner/test-tool',
    url: 'https://github.com/owner/test-tool',
  };

  const mockRecord = {
    id: 1,
    toolId: 1,
    tool: mockTool,
    status: CollectionStatus.PRACTICED,
    isHidden: false,
    statusChangedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubToolService,
        {
          provide: GithubFeedService,
          useValue: {
            getFeed: jest.fn(),
            getCollection: jest.fn(),
          },
        },
        {
          provide: GithubWorkflowService,
          useValue: {
            keepTool: jest.fn(),
            hideTool: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: GithubConfigService,
          useValue: {
            getConfig: jest.fn(),
            createConfig: jest.fn(),
            deleteConfig: jest.fn(),
            updateConfig: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(GithubToolService);
    feedService = module.get(GithubFeedService);
    workflowService = module.get(GithubWorkflowService);
    configService = module.get(GithubConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates feed loading to GithubFeedService', async () => {
    feedService.getFeed.mockResolvedValue([mockTool] as never);

    const result = await service.getFeed();

    expect(feedService.getFeed).toHaveBeenCalled();
    expect(result).toEqual([mockTool]);
  });

  it('delegates collection loading to GithubFeedService', async () => {
    feedService.getCollection.mockResolvedValue([mockRecord] as never);

    const result = await service.getCollection(CollectionStatus.PRACTICED, 'tool');

    expect(feedService.getCollection).toHaveBeenCalledWith(CollectionStatus.PRACTICED, 'tool');
    expect(result).toEqual([mockRecord]);
  });

  it('delegates keep and hide workflow actions to GithubWorkflowService', async () => {
    workflowService.keepTool.mockResolvedValue(mockRecord as never);
    workflowService.hideTool.mockResolvedValue(undefined as never);

    await expect(service.keepTool(1)).resolves.toEqual(mockRecord);
    await expect(service.hideTool(1)).resolves.toBeUndefined();

    expect(workflowService.keepTool).toHaveBeenCalledWith(1);
    expect(workflowService.hideTool).toHaveBeenCalledWith(1);
  });

  it('delegates status updates to GithubWorkflowService', async () => {
    workflowService.updateStatus.mockResolvedValue({ ...mockRecord, status: CollectionStatus.DEEP_USE } as never);

    const result = await service.updateStatus(1, { status: CollectionStatus.DEEP_USE });

    expect(workflowService.updateStatus).toHaveBeenCalledWith(1, CollectionStatus.DEEP_USE);
    expect(result.status).toBe(CollectionStatus.DEEP_USE);
  });

  it('delegates config CRUD operations to GithubConfigService', async () => {
    const config = { id: 1, keyword: 'nestjs', weight: 5, createdAt: new Date() };
    configService.getConfig.mockResolvedValue([config] as never);
    configService.createConfig.mockResolvedValue(config as never);
    configService.deleteConfig.mockResolvedValue(undefined as never);
    configService.updateConfig.mockResolvedValue({ ...config, weight: 8 } as never);

    await expect(service.getConfig()).resolves.toEqual([config]);
    await expect(service.createConfig({ keyword: 'nestjs', weight: 5 })).resolves.toEqual(config);
    await expect(service.deleteConfig(1)).resolves.toBeUndefined();
    await expect(service.updateConfig(1, 8)).resolves.toEqual({ ...config, weight: 8 });
  });
});
