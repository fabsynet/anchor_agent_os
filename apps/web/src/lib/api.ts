import { createClient } from '@/lib/supabase/client';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  headers?: Record<string, string>;
}

async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const supabase = createClient();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (forceRefresh) {
    // Force a token refresh by calling getUser() which validates with Supabase server
    await supabase.auth.getUser();
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

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

  // On 401, refresh the token and retry once
  if (response.status === 401) {
    const freshHeaders = await getAuthHeaders(true);
    const retryHeaders = { ...freshHeaders, ...options?.headers };

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: retryHeaders,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null);

    if (!retryResponse) {
      throw new Error('Unable to connect to the API server.');
    }

    if (!retryResponse.ok) {
      const error = await retryResponse.json().catch(() => ({
        message: `Request failed with status ${retryResponse.status}`,
      }));
      throw new Error(error.message || `API error: ${retryResponse.status}`);
    }

    if (retryResponse.status === 204) return undefined as T;
    return retryResponse.json();
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

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    // IMPORTANT: Do NOT set Content-Type -- browser sets it with multipart boundary

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    }).catch(() => null);

    if (!response) {
      throw new Error('Unable to connect to the API server. Make sure the backend is running.');
    }

    // On 401, refresh token and retry (same pattern as request())
    if (response.status === 401) {
      await supabase.auth.getUser(); // force refresh
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const retryHeaders: Record<string, string> = {};
      if (freshSession?.access_token) {
        retryHeaders['Authorization'] = `Bearer ${freshSession.access_token}`;
      }
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: retryHeaders,
        body: formData,
      }).catch(() => null);

      if (!retryResponse) throw new Error('Unable to connect to the API server.');
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ message: `Upload failed: ${retryResponse.status}` }));
        throw new Error(error.message);
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `Upload failed: ${response.status}` }));
      throw new Error(error.message);
    }

    return response.json();
  },
};
