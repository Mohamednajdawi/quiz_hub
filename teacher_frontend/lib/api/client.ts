import axios from 'axios';

// Ensure API URL has protocol
const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'quizhub-production-1ddf.up.railway.app';
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Reduced from 30s to 10s for better UX
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
      // Remove Content-Type header for FormData uploads
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      
      if (status === 401) {
        // Clear auth on 401
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Authentication failed. Please log in again.'));
      } else if (status === 403) {
        return Promise.reject(new Error('Access denied. You do not have permission to access this resource.'));
      } else if (status === 404) {
        return Promise.reject(new Error('Resource not found.'));
      } else if (status === 402) {
        // Payment required / Generation limit reached
        const detail = error.response.data?.detail || message;
        return Promise.reject(new Error(detail || 'Generation limit reached. Please upgrade to continue.'));
      } else if (status === 500) {
        // Include more details from the server if available
        const detail = error.response.data?.detail || message;
        return Promise.reject(new Error(detail || 'Server error. Please try again later.'));
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      return Promise.reject(error);
    }
  }
);

// Public API client (no auth headers) for shared quizzes/essays
export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Reduced from 30s to 10s for better UX
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;

