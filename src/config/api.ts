import axios from 'axios';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8002';

/**
 * Axios client instance for iBot gateway.
 * Always sends credentials (HttpOnly cookies).
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Response interceptor for automatic silent token refresh on 401 status.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the response status is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthEndpoint =
        originalRequest.url?.endsWith('/auth/refresh') ||
        originalRequest.url?.endsWith('/auth/login') ||
        originalRequest.url?.endsWith('/auth/register');

      if (!isAuthEndpoint) {
        originalRequest._retry = true;
        try {
          // Attempt to refresh the session
          await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Session refresh failed:', refreshError);
        }

        // If refresh fails, notify the app that the session is expired
        window.dispatchEvent(new CustomEvent('auth_session_expired'));
      }
    }

    return Promise.reject(error);
  }
);
