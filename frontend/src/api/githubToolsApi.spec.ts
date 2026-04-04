import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, githubToolsApi } from './githubToolsApi';

describe('githubToolsApi', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('attaches auth header and query params when loading collection', async () => {
    localStorage.setItem('token', 'test-token');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    } as unknown as Response);

    await githubToolsApi.getCollection('deep_use', 'agent');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/github-tools/collection?status=deep_use&search=agent`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('surfaces backend error payloads for void requests', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ message: 'not found' }),
    } as unknown as Response);

    await expect(githubToolsApi.hideTool(1)).rejects.toThrow('not found');
  });
});
