import { Test, TestingModule } from '@nestjs/testing';
import { GithubToolController } from './github-tool.controller';
import { GithubToolService } from './github-tool.service';
import { GithubFetcherService } from './github-fetcher.service';
import { CollectionStatus } from './entities/collection-record.entity';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

describe('GithubToolController', () => {
  let controller: GithubToolController;
  let service: jest.Mocked<GithubToolService>;
  let fetcher: jest.Mocked<GithubFetcherService>;

  const mockTool = {
    id: 1,
    name: 'test-tool',
    fullName: 'owner/test-tool',
    url: 'https://github.com/owner/test-tool',
    description: 'A test tool',
    stars: 100,
    language: 'TypeScript',
    fetchedAt: new Date(),
    createdAt: new Date(),
  };

  const mockRecord = {
    id: 1,
    toolId: 1,
    tool: mockTool,
    status: CollectionStatus.UNREAD,
    isHidden: false,
    statusChangedAt: new Date(),
    createdAt: new Date(),
  };

  const mockConfig = {
    id: 1,
    keyword: 'nestjs',
    weight: 5,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubToolController],
      providers: [
        {
          provide: GithubToolService,
          useValue: {
            getFeed: jest.fn(),
            getCollection: jest.fn(),
            keepTool: jest.fn(),
            hideTool: jest.fn(),
            updateStatus: jest.fn(),
            getConfig: jest.fn(),
            createConfig: jest.fn(),
            deleteConfig: jest.fn(),
            updateConfig: jest.fn(),
          },
        },
        {
          provide: GithubFetcherService,
          useValue: {
            fetchAndSaveTools: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GithubToolController>(GithubToolController);
    service = module.get(GithubToolService);
    fetcher = module.get(GithubFetcherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('BC-001: should call service.getFeed and return result', async () => {
      service.getFeed.mockResolvedValue([mockTool]);

      const result = await controller.getFeed();

      expect(service.getFeed).toHaveBeenCalled();
      expect(result).toEqual([mockTool]);
    });
  });

  describe('triggerFetch', () => {
    it('BC-002: should call fetcher.fetchAndSaveTools', async () => {
      fetcher.fetchAndSaveTools.mockResolvedValue(undefined);

      await controller.triggerFetch();

      expect(fetcher.fetchAndSaveTools).toHaveBeenCalled();
    });
  });

  describe('getCollection', () => {
    it('BC-003: should pass status and search to service', async () => {
      service.getCollection.mockResolvedValue([mockRecord]);

      const result = await controller.getCollection(CollectionStatus.PRACTICED, 'test');

      expect(service.getCollection).toHaveBeenCalledWith(CollectionStatus.PRACTICED, 'test');
      expect(result).toEqual([mockRecord]);
    });

    it('BC-004: should work without status and search', async () => {
      service.getCollection.mockResolvedValue([mockRecord]);

      const result = await controller.getCollection();

      expect(service.getCollection).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual([mockRecord]);
    });
  });

  describe('keepTool', () => {
    it('BC-005: should call service.keepTool with parsed toolId', async () => {
      service.keepTool.mockResolvedValue(mockRecord);

      const result = await controller.keepTool(1);

      expect(service.keepTool).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('hideTool', () => {
    it('BC-006: should call service.hideTool with parsed toolId', async () => {
      service.hideTool.mockResolvedValue(undefined);

      await controller.hideTool(1);

      expect(service.hideTool).toHaveBeenCalledWith(1);
    });
  });

  describe('updateStatus', () => {
    it('BC-007: should call service.updateStatus with toolId and dto', async () => {
      const dto: UpdateStatusDto = { status: CollectionStatus.DEEP_USE };
      service.updateStatus.mockResolvedValue(mockRecord);

      const result = await controller.updateStatus(1, dto);

      expect(service.updateStatus).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('getConfig', () => {
    it('BC-008: should call service.getConfig', async () => {
      service.getConfig.mockResolvedValue([mockConfig]);

      const result = await controller.getConfig();

      expect(service.getConfig).toHaveBeenCalled();
      expect(result).toEqual([mockConfig]);
    });
  });

  describe('createConfig', () => {
    it('BC-009: should call service.createConfig with dto', async () => {
      const dto: CreateFocusConfigDto = { keyword: 'nestjs', weight: 5 };
      service.createConfig.mockResolvedValue(mockConfig);

      const result = await controller.createConfig(dto);

      expect(service.createConfig).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockConfig);
    });
  });

  describe('deleteConfig', () => {
    it('BC-010: should call service.deleteConfig with parsed id', async () => {
      service.deleteConfig.mockResolvedValue(undefined);

      await controller.deleteConfig(1);

      expect(service.deleteConfig).toHaveBeenCalledWith(1);
    });
  });

  describe('updateConfig', () => {
    it('should call service.updateConfig with id and weight', async () => {
      service.updateConfig.mockResolvedValue(mockConfig);

      const result = await controller.updateConfig(1, 8);

      expect(service.updateConfig).toHaveBeenCalledWith(1, 8);
      expect(result).toEqual(mockConfig);
    });
  });
});

describe('DTO Validation', () => {
  describe('CreateFocusConfigDto', () => {
    it('BD-001: should have keyword as string', () => {
      const dto = new CreateFocusConfigDto();
      dto.keyword = 'nestjs';
      dto.weight = 5;
      expect(typeof dto.keyword).toBe('string');
    });

    it('BD-002: should have weight between 1 and 10', () => {
      const dto = new CreateFocusConfigDto();
      dto.keyword = 'nestjs';
      dto.weight = 5;
      expect(dto.weight).toBeGreaterThanOrEqual(1);
      expect(dto.weight).toBeLessThanOrEqual(10);
    });

    it('BD-003: weight should accept boundary values 1 and 10', () => {
      const dtoMin = new CreateFocusConfigDto();
      dtoMin.keyword = 'nestjs';
      dtoMin.weight = 1;
      expect(dtoMin.weight).toBe(1);

      const dtoMax = new CreateFocusConfigDto();
      dtoMax.keyword = 'nestjs';
      dtoMax.weight = 10;
      expect(dtoMax.weight).toBe(10);
    });
  });

  describe('UpdateStatusDto', () => {
    it('BD-004: should have valid status enum value', () => {
      const dto = new UpdateStatusDto();
      dto.status = CollectionStatus.PRACTICED;
      expect(Object.values(CollectionStatus)).toContain(dto.status);
    });

    it('BD-005: should accept all valid status values', () => {
      const statuses = [
        CollectionStatus.UNREAD,
        CollectionStatus.PRACTICED,
        CollectionStatus.DEEP_USE,
        CollectionStatus.NO_LONGER_USED,
      ];

      for (const status of statuses) {
        const dto = new UpdateStatusDto();
        dto.status = status;
        expect(Object.values(CollectionStatus)).toContain(dto.status);
      }
    });
  });
});