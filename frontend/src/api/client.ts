import { ApiError } from './types';
import type { ApiErrorPayload } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function parseBody(response: Response) {
  if (typeof response.text === 'function') {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  if (typeof response.json === 'function') {
    return response.json() as Promise<unknown>;
  }

  return null;
}

function buildHeaders(options: ApiRequestOptions) {
  const headers: Record<string, string> = {};

  if (options.headers instanceof Headers) {
    for (const [key, value] of options.headers.entries()) {
      headers[key] = value;
    }
  } else if (Array.isArray(options.headers)) {
    for (const [key, value] of options.headers) {
      headers[key] = value;
    }
  } else if (options.headers) {
    Object.assign(headers, options.headers);
  }
  const token = localStorage.getItem('token');

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body
    && !(options.body instanceof FormData)
    && headers['Content-Type'] === undefined
    && headers['content-type'] === undefined
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const body = await parseBody(response);
  if (!response.ok) {
    const payload: Partial<ApiErrorPayload> & { message: string } =
      body && typeof body === 'object'
        ? (body as ApiErrorPayload)
        : { message: typeof body === 'string' ? body : `HTTP ${response.status}` };

    if (response.status === 401 && options.auth !== false) {
      unauthorizedHandler?.();
    }

    throw new ApiError({
      code: payload.code,
      message: payload.message || `HTTP ${response.status}`,
      statusCode: payload.statusCode || response.status,
      details: payload.details,
      timestamp: payload.timestamp,
      path: payload.path,
    });
  }

  return (body ?? null) as T;
}

export async function apiRequestVoid(path: string, options: ApiRequestOptions = {}): Promise<void> {
  await apiRequest<null>(path, options);
}
