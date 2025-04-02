import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage key
const TOKEN_KEY = '@qotd_token';

// Token cache in memory
let currentToken: string | null = null;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: BodyInit;
  headers?: Record<string, string>;
};

// Initialize token from storage
async function initializeToken() {
  try {
    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      currentToken = storedToken;
    }
  } catch (error) {
    console.error('Failed to load token from storage:', error);
  }
}

// Call initialize when the module loads
initializeToken();

async function request(endpoint: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    ...options.headers,
  };
  let body = options.body;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  // Add token if we have one
  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  } else {
    await initializeToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body,
  });

  // Update token if present in response
  const newToken = response.headers.get('Authorization')?.split(' ')[1];
  if (newToken) {
    currentToken = newToken;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
    } catch (error) {
      console.error('Failed to save token to storage:', error);
    }
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
  async get(endpoint: string, options: RequestOptions = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint: string, body: any, options: RequestOptions = {}) {
    return request(endpoint, { ...options, method: 'POST', body });
  },

  async put(endpoint: string, body: any, options: RequestOptions = {}) {
    return request(endpoint, { ...options, method: 'PUT', body });
  },

  async patch(endpoint: string, body: any, options: RequestOptions = {}) {
    return request(endpoint, { ...options, method: 'PATCH', body });
  },

  async delete(endpoint: string, options: RequestOptions = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  },

  // Get current token
  getToken() {
    return currentToken;
  },

  // Clear token (e.g. for logout)
  async clearToken() {
    currentToken = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token from storage:', error);
    }
  },
};
