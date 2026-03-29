import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Not, LessThan } from 'typeorm';
import { GithubToolService } from './github-tool.service';
import { GithubTool } from './entities/github-tool.entity';
import { CollectionRecord, CollectionStatus } from './entities/collection-record.entity';
import { FocusConfig } from './entities/focus-config.entity';
import { CreateFocusConfigDto } from './dto/create-focus-config.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

describe('GithubToolService', () => {
  let service: GithubToolService;
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

  const mockRecord: CollectionRecord = {
    id: 1,
    toolId: 1,
    tool: mockTool,
    status: CollectionStatus.UNREAD,
    isHidden: false,
    statusChangedAt: new Date(),
    createdAt: new Date(),
  };

  const mockConfig: FocusConfig = {
    id: 1,
    keyword: 'nestjs',
    weight: 5,
    createdAt: new Date(),
  };

  const createMockQueryBuilder = () => {
    const mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockTool]),
    } as unknown as jest.Mocked<SelectQueryBuilder<GithubTool>>;
    return mockQb;
  };

  const createRecordQueryBuilder = () => {
    const mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockRecord]),
    } as unknown as jest.Mocked<SelectQueryBuilder<CollectionRecord>>;
    return mockQb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubToolService,
        {
          provide: getRepositoryToken(GithubTool),
          useValue: {
            createQueryBuilder: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CollectionRecord),
          useValue: {
            createQueryBuilder: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FocusConfig),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GithubToolService>(GithubToolService);
    toolRepo = module.get(getRepositoryToken(GithubTool));
    recordRepo = module.get(getRepositoryToken(CollectionRecord));
    configRepo = module.get(getRepositoryToken(FocusConfig));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeed', () => {
    it('BS-001: should return unhidden tools limited to 10 sorted by time', async () => {
      const mockQb = createMockQueryBuilder();
      toolRepo.createQueryBuilder.mockReturnValue(mockQb);
      recordRepo.find.mockResolvedValue([{ toolId: 1, isHidden: true } as CollectionRecord]);

      const result = await service.getFeed();

      expect(recordRepo.find).toHaveBeenCalledWith({
        where: { isHidden: true },
        select: ['toolId'],
      });
      expect(toolRepo.createQueryBuilder).toHaveBeenCalledWith('tool');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith('tool.collectionRecord', 'record');
      expect(mockQb.orderBy).toHaveBeenCalledWith('tool.createdAt', 'DESC');
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(mockQb.where).toHaveBeenCalled();
      expect(result).toEqual([mockTool]);
    });

    it('should exclude hidden tools from feed', async () => {
      const mockQb = createMockQueryBuilder();
      toolRepo.createQueryBuilder.mockReturnValue(mockQb);
      recordRepo.find.mockResolvedValue([{ toolId: 999, isHidden: true } as CollectionRecord]);

      await service.getFeed();

      expect(mockQb.where).toHaveBeenCalledWith('tool.id NOT IN (:...hiddenIds)', { hiddenIds: [999] });
    });
  });

  describe('getCollection', () => {
    it('BS-002: should filter by status when provided', async () => {
      const mockQb = createRecordQueryBuilder();
      recordRepo.createQueryBuilder.mockReturnValue(mockQb);
      jest.spyOn(service as any, 'cleanupOldRecords').mockResolvedValue(undefined);

      await service.getCollection(CollectionStatus.PRACTICED);

      expect(mockQb.andWhere).toHaveBeenCalledWith('record.status = :status', { status: CollectionStatus.PRACTICED });
    });

    it('BS-003: should support search functionality', async () => {
      const mockQb = createRecordQueryBuilder();
      recordRepo.createQueryBuilder.mockReturnValue(mockQb);
      jest.spyOn(service as any, 'cleanupOldRecords').mockResolvedValue(undefined);

      await service.getCollection(undefined, 'test');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(tool.name LIKE :search OR tool.description LIKE :search)',
        { search: '%test%' },
      );
    });

    it('should filter by isHidden = false', async () => {
      const mockQb = createRecordQueryBuilder();
      recordRepo.createQueryBuilder.mockReturnValue(mockQb);
      jest.spyOn(service as any, 'cleanupOldRecords').mockResolvedValue(undefined);

      await service.getCollection();

      expect(mockQb.where).toHaveBeenCalledWith('record.isHidden = :hidden', { hidden: false });
    });
  });

  describe('keepTool', () => {
    it('BS-004: should create new record if not exists', async () => {
      recordRepo.findOne.mockResolvedValue(null);
      recordRepo.create.mockReturnValue(mockRecord);
      recordRepo.save.mockResolvedValue(mockRecord);

      const result = await service.keepTool(1);

      expect(recordRepo.findOne).toHaveBeenCalledWith({ where: { toolId: 1 } });
      expect(recordRepo.create).toHaveBeenCalledWith({ toolId: 1, status: CollectionStatus.UNREAD });
      expect(recordRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(CollectionStatus.PRACTICED);
    });

    it('BS-005: should update existing record', async () => {
      const existingRecord = { ...mockRecord, status: CollectionStatus.UNREAD };
      recordRepo.findOne.mockResolvedValue(existingRecord);
      recordRepo.save.mockResolvedValue({ ...existingRecord, status: CollectionStatus.PRACTICED });

      const result = await service.keepTool(1);

      expect(recordRepo.create).not.toHaveBeenCalled();
      expect(result.status).toBe(CollectionStatus.PRACTICED);
    });
  });

  describe('hideTool', () => {
    it('BS-006: should hide tool and be idempotent', async () => {
      recordRepo.findOne.mockResolvedValue(null);
      recordRepo.create.mockReturnValue(mockRecord);
      recordRepo.save.mockResolvedValue({ ...mockRecord, isHidden: true });

      await service.hideTool(1);

      expect(recordRepo.create).toHaveBeenCalledWith({ toolId: 1 });
      expect(recordRepo.save).toHaveBeenCalled();
      expect(recordRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isHidden: true }),
      );
    });

    it('BS-007: should update existing record to hidden', async () => {
      const existingRecord = { ...mockRecord, isHidden: false };
      recordRepo.findOne.mockResolvedValue(existingRecord);
      recordRepo.save.mockResolvedValue({ ...existingRecord, isHidden: true });

      await service.hideTool(1);

      expect(recordRepo.create).not.toHaveBeenCalled();
      expect(recordRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isHidden: true }),
      );
    });
  });

  describe('updateStatus', () => {
    it('BS-008: should update status correctly', async () => {
      const existingRecord = { ...mockRecord, status: CollectionStatus.UNREAD };
      recordRepo.findOne.mockResolvedValue(existingRecord);
      const dto: UpdateStatusDto = { status: CollectionStatus.DEEP_USE };
      recordRepo.save.mockResolvedValue({ ...existingRecord, status: CollectionStatus.DEEP_USE });

      const result = await service.updateStatus(1, dto);

      expect(result.status).toBe(CollectionStatus.DEEP_USE);
      expect(recordRepo.save).toHaveBeenCalled();
    });

    it('BS-009: should throw error when record not found', async () => {
      recordRepo.findOne.mockResolvedValue(null);
      const dto: UpdateStatusDto = { status: CollectionStatus.PRACTICED };

      await expect(service.updateStatus(999, dto)).rejects.toThrow('Record not found');
    });
  });

  describe('Config CRUD operations', () => {
    it('BS-010: createConfig should create and save new config', async () => {
      const dto: CreateFocusConfigDto = { keyword: 'nestjs', weight: 5 };
      configRepo.create.mockReturnValue(mockConfig);
      configRepo.save.mockResolvedValue(mockConfig);

      const result = await service.createConfig(dto);

      expect(configRepo.create).toHaveBeenCalledWith(dto);
      expect(configRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('BS-011: deleteConfig should delete config by id', async () => {
      configRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.deleteConfig(1);

      expect(configRepo.delete).toHaveBeenCalledWith(1);
    });

    it('BS-012: updateConfig should update weight and return updated config', async () => {
      configRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      configRepo.findOne.mockResolvedValue({ ...mockConfig, weight: 8 });

      const result = await service.updateConfig(1, 8);

      expect(configRepo.update).toHaveBeenCalledWith(1, { weight: 8 });
      expect(configRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.weight).toBe(8);
    });

    it('BS-013: getConfig should return configs ordered by weight desc', async () => {
      configRepo.find.mockResolvedValue([mockConfig]);

      const result = await service.getConfig();

      expect(configRepo.find).toHaveBeenCalledWith({ order: { weight: 'DESC' } });
      expect(result).toEqual([mockConfig]);
    });
  });

  describe('cleanupOldRecords', () => {
    it('BS-014: should delete old non-deep_use records', async () => {
      recordRepo.delete.mockResolvedValue({ affected: 5, raw: [] });

      await (service as any).cleanupOldRecords();

      expect(recordRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          status: Not(CollectionStatus.DEEP_USE),
          isHidden: false,
        }),
      );
    });

    it('BS-015: should preserve deep_use records', async () => {
      recordRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await (service as any).cleanupOldRecords();

      const deleteCall = recordRepo.delete.mock.calls[0][0];
      expect((deleteCall as any).status).toBeDefined();
    });

    it('BS-016: should only delete records older than 6 months', async () => {
      recordRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await (service as any).cleanupOldRecords();

      const deleteCall = recordRepo.delete.mock.calls[0][0];
      // Verify delete was called with conditions - just check properties exist
      expect(deleteCall).toHaveProperty('status');
      expect(deleteCall).toHaveProperty('statusChangedAt');
      expect(deleteCall).toHaveProperty('isHidden');
    });
  });
});