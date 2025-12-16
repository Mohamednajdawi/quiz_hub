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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:25',message:'Request interceptor called',data:{url:config.url,method:config.method,hasWindow:typeof window!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:29',message:'Token retrieved from localStorage',data:{hasToken:!!token,tokenLength:token?.length||0,url:config.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:40',message:'Request interceptor error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:52',message:'401 error detected',data:{currentPath:typeof window!=='undefined'?window.location.pathname:'N/A',url:error.config?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Only clear auth and redirect if we're not already on login page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:58',message:'401 redirect triggered',data:{currentPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Use a small delay to avoid redirect loops
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/ce1c6d50-1c88-48f7-82cd-e69144f360b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:82',message:'Network error detected',data:{url:error.config?.url,method:error.config?.method,hasResponse:!!error.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Network error - don't destroy the app, just return a retry-able error
      // The query will retry automatically
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

