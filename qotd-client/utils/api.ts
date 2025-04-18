import { useCallback } from 'react';
import { useSession } from '@/context/SessionContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export interface RequestOptions {
  body?: BodyInit;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export interface Session {
  token: string;
  refresh_token: string;
  token_expires_at: string;
}

export function useFetchApiAndParseJson() {
  const fetchApi = useFetchApi();

  return useCallback(
    async (endpoint: string, options: RequestOptions = {}) => {
      const response = await fetchApi(endpoint, options);

      return response.json();
    },
    [fetchApi],
  );
}

export function useFetchApi() {
  const { session } = useSession();

  return useCallback(
    async (endpoint: string, options: RequestOptions = {}) => {
      const headers: Record<string, string> = {
        ...options.headers,
      };

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      // Add token if we have one
      if (session) {
        headers.Authorization = `Bearer ${session.token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (!response.ok) {
        const error = await response.json().then(({ error }: { error: string }) => error);
        throw new Error(error);
      }
      return response;
    },
    [session],
  );
}
