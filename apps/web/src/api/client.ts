import type { ApiErrorBody, ErrorCode, ValidationIssue } from '@taskapp/shared';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: ValidationIssue[];

  constructor(status: number, code: ErrorCode, message: string, details: ValidationIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ApiErrorBody).error?.message === 'string'
  );
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'same-origin', // le cookie de session httpOnly est envoyé automatiquement
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'INTERNAL_ERROR', 'Impossible de joindre le serveur');
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      const { code, message, details } = payload.error;
      throw new ApiError(response.status, code, message, details);
    }
    throw new ApiError(response.status, 'INTERNAL_ERROR', 'Une erreur inattendue est survenue');
  }

  return payload as T;
}
