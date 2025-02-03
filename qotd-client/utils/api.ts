// Simple token storage in memory
let currentToken: string | null = null;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

async function request(endpoint: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add token if we have one
  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Update token if present in response
  const newToken = response.headers.get('Authorization')?.split(' ')[1];
  if (newToken) {
    currentToken = newToken;
  }

  // Handle non-2xx responses
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Parse JSON response if present
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response;
}

// Convenience methods for common HTTP methods
export const api = {
  get: (endpoint: string, options: RequestOptions = {}) => request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body: any, options: RequestOptions = {}) =>
    request(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint: string, body: any, options: RequestOptions = {}) =>
    request(endpoint, { ...options, method: 'PUT', body }),

  delete: (endpoint: string, options: RequestOptions = {}) => request(endpoint, { ...options, method: 'DELETE' }),

  // Get current token
  getToken: () => currentToken,

  // Set token manually (e.g. after login)
  setToken: (token: string) => {
    currentToken = token;
  },

  // Clear token (e.g. for logout)
  clearToken: () => {
    currentToken = null;
  },
};
