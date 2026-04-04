import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';

describe('apiRequest', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('attaches bearer token by default', async () => {
    localStorage.setItem('token', 'persisted-token');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    } as unknown as Response);

    await apiRequest('/todos');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/todos'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer persisted-token',
        }),
      }),
    );
  });

  it('throws normalized backend error payloads', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue(JSON.stringify({ message: 'missing', code: 'RESOURCE_NOT_FOUND', statusCode: 404 })),
    } as unknown as Response);

    await expect(apiRequest('/todos/1')).rejects.toThrow('missing');
  });
});
