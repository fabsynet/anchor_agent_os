import { createClient } from '@/lib/supabase/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  headers?: Record<string, string>;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiOptions,
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const headers = { ...authHeaders, ...options?.headers };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);

  if (!response) {
    throw new Error(
      'Unable to connect to the API server. Make sure the backend is running (pnpm --filter api dev).',
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>('PUT', path, body, options),

  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>('PATCH', path, body, options),

  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>('DELETE', path, undefined, options),
};
