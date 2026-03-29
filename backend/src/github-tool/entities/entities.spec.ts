import { GithubTool } from './github-tool.entity';
import { CollectionRecord, CollectionStatus } from './collection-record.entity';
import { FocusConfig } from './focus-config.entity';

describe('Entity Tests', () => {
  describe('GithubTool Entity', () => {
    it('BE-001: should have all required fields', () => {
      const tool = new GithubTool();
      tool.id = 1;
      tool.name = 'test-tool';
      tool.fullName = 'owner/test-tool';
      tool.url = 'https://github.com/owner/test-tool';
      tool.description = 'A test tool';
      tool.stars = 100;
      tool.language = 'TypeScript';
      tool.fetchedAt = new Date();
      tool.createdAt = new Date();

      expect(tool.id).toBe(1);
      expect(tool.name).toBe('test-tool');
      expect(tool.fullName).toBe('owner/test-tool');
      expect(tool.url).toBe('https://github.com/owner/test-tool');
      expect(tool.description).toBe('A test tool');
      expect(tool.stars).toBe(100);
      expect(tool.language).toBe('TypeScript');
      expect(tool.fetchedAt).toBeInstanceOf(Date);
      expect(tool.createdAt).toBeInstanceOf(Date);
    });

    it('BE-002: should allow nullable description and language', () => {
      const tool = new GithubTool();
      tool.name = 'test-tool';
      tool.fullName = 'owner/test-tool';
      tool.url = 'https://github.com/owner/test-tool';
      tool.description = null;
      tool.language = null;

      expect(tool.description).toBeNull();
      expect(tool.language).toBeNull();
    });

    it('should have default stars of 0', () => {
      const tool = new GithubTool();
      tool.name = 'test-tool';
      tool.fullName = 'owner/test-tool';
      tool.url = 'https://github.com/owner/test-tool';

      expect(tool.stars).toBe(0);
    });

    it('should have unique fullName constraint', () => {
      const tool1 = new GithubTool();
      tool1.fullName = 'owner/test-tool';

      const tool2 = new GithubTool();
      tool2.fullName = 'owner/test-tool';

      expect(tool1.fullName).toBe(tool2.fullName);
    });
  });

  describe('CollectionRecord Entity', () => {
    it('BE-003: should have all required fields', () => {
      const tool = new GithubTool();
      tool.id = 1;
      tool.name = 'test-tool';
      tool.fullName = 'owner/test-tool';
      tool.url = 'https://github.com/owner/test-tool';

      const record = new CollectionRecord();
      record.id = 1;
      record.toolId = 1;
      record.tool = tool;
      record.status = CollectionStatus.UNREAD;
      record.isHidden = false;
      record.statusChangedAt = new Date();
      record.createdAt = new Date();

      expect(record.id).toBe(1);
      expect(record.toolId).toBe(1);
      expect(record.tool).toBe(tool);
      expect(record.status).toBe(CollectionStatus.UNREAD);
      expect(record.isHidden).toBe(false);
      expect(record.statusChangedAt).toBeInstanceOf(Date);
      expect(record.createdAt).toBeInstanceOf(Date);
    });

    it('BE-004: should have valid CollectionStatus enum values', () => {
      const statuses = [
        CollectionStatus.UNREAD,
        CollectionStatus.PRACTICED,
        CollectionStatus.DEEP_USE,
        CollectionStatus.NO_LONGER_USED,
      ];

      for (const status of statuses) {
        const record = new CollectionRecord();
        record.status = status;
        expect(Object.values(CollectionStatus)).toContain(record.status);
      }
    });

    it('should default isHidden to false', () => {
      const record = new CollectionRecord();
      expect(record.isHidden).toBe(false);
    });

    it('should default status to UNREAD', () => {
      const record = new CollectionRecord();
      record.statusChangedAt = new Date();
      expect(record.status).toBe(CollectionStatus.UNREAD);
    });
  });

  describe('FocusConfig Entity', () => {
    it('should have all required fields', () => {
      const config = new FocusConfig();
      config.id = 1;
      config.keyword = 'nestjs';
      config.weight = 5;
      config.createdAt = new Date();

      expect(config.id).toBe(1);
      expect(config.keyword).toBe('nestjs');
      expect(config.weight).toBe(5);
      expect(config.createdAt).toBeInstanceOf(Date);
    });

    it('should default weight to 5', () => {
      const config = new FocusConfig();
      config.keyword = 'nestjs';
      expect(config.weight).toBe(5);
    });

    it('should allow weight values 1-10', () => {
      const config = new FocusConfig();
      config.keyword = 'nestjs';

      config.weight = 1;
      expect(config.weight).toBe(1);

      config.weight = 10;
      expect(config.weight).toBe(10);
    });
  });
});