export interface ApiErrorPayload {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(payload: Partial<ApiErrorPayload> & { message: string }) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.statusCode = payload.statusCode || 500;
    this.details = payload.details;
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
