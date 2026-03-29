import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { githubToolsApi } from './githubToolsApi';

describe('githubToolsApi', () => {
  const { fetch } = window;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    window.fetch = mockFetch;
  });

  afterEach(() => {
    window.fetch = fetch;
    vi.restoreAllMocks();
  });

  describe('getFeed', () => {
    it('FS-001: returns array of GithubTool', async () => {
      const mockTools = [
        {
          id: 1,
          name: 'test-tool',
          fullName: 'org/test-tool',
          url: 'https://github.com/org/test-tool',
          description: 'A test tool',
          stars: 1000,
          language: 'TypeScript',
          fetchedAt: '2026-03-29T00:00:00Z',
          createdAt: '2026-03-29T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTools),
      });

      const result = await githubToolsApi.getFeed();

      expect(result).toEqual(mockTools);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('stars');
    });
  });

  describe('getCollection', () => {
    it('FS-002: builds URL with status parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await githubToolsApi.getCollection('practiced');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=practiced'),
        expect.any(Object)
      );
    });

    it('FS-002: builds URL with search parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await githubToolsApi.getCollection(undefined, 'react');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=react'),
        expect.any(Object)
      );
    });

    it('FS-002: builds URL with both parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await githubToolsApi.getCollection('deep_use', 'cli');

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('status=deep_use');
      expect(url).toContain('search=cli');
    });
  });

  describe('keepTool', () => {
    it('FS-003: uses POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await githubToolsApi.keepTool(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('updateStatus', () => {
    it('FS-004: sends JSON body with status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await githubToolsApi.updateStatus(1, 'practiced');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status: 'practiced' }),
        })
      );
    });

    it('FS-004: includes correct Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await githubToolsApi.updateStatus(1, 'deep_use');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('createConfig', () => {
    it('FS-005: sends correct request body format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      await githubToolsApi.createConfig('AI', 8);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ keyword: 'AI', weight: 8 }),
        })
      );
    });
  });

  describe('API error handling', () => {
    it('FS-006: throws error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(githubToolsApi.getFeed()).rejects.toThrow();
    });
  });
});
