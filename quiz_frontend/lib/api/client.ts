import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quizhub-production-1ddf.up.railway.app/';

// Debug: Log the API URL (only in browser, not during SSR)
if (typeof window !== 'undefined') {
  console.log('[API Client] Using API URL:', API_BASE_URL);
  console.log('[API Client] NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Remove Content-Type header for FormData uploads (let browser set it with boundary)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      console.log('[API Client] Making request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        hasAuth: !!config.headers.Authorization,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Request timeout
      return Promise.reject(new Error('Request timeout. The server took too long to respond.'));
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      
      // Provide more specific error messages
      if (status === 401) {
        return Promise.reject(new Error('Authentication failed. Please log in again.'));
      } else if (status === 403) {
        return Promise.reject(new Error('Access denied. You do not have permission to access this resource.'));
      } else if (status === 404) {
        return Promise.reject(new Error('Resource not found.'));
      } else if (status === 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Client] Network error details:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        message: error.message,
      });
      
      // Check if it's a CORS issue
      if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
        return Promise.reject(new Error('CORS error. Please check your API URL configuration.'));
      }
      
      return Promise.reject(new Error('Network error. Please check your connection and ensure the API server is running.'));
    } else {
      // Something else happened
      console.error('[API Client] Unknown error:', error);
      return Promise.reject(error);
    }
  }
);

export default apiClient;

