import axios from 'axios';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8002';

interface ApiErrorPayload {
  message?: string;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
}

const normalizeApiError = (error: unknown): Error => {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error ? error : new Error('An unexpected request error occurred.');
  }

  const payload = error.response?.data;
  const fieldDetails = payload?.errors
    ?.map((detail) => {
      if (!detail.message) return null;
      const field = detail.field?.replace(/^body\./, '') ?? 'input';
      return `${field}: ${detail.message}`;
    })
    .filter((detail): detail is string => detail !== null);

  const message =
    (fieldDetails?.length ? fieldDetails.join(' ') : payload?.message) ||
    error.message;

  return new Error(message, { cause: error });
};

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
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    const originalRequest = error.config as
      | (NonNullable<typeof error.config> & { _retry?: boolean })
      | undefined;

    // Check if the response status is 401 and we haven't retried this request yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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

    return Promise.reject(normalizeApiError(error));
  }
);
