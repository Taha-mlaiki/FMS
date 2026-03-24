import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { clearUserRoleCookie } from '@/lib/auth-role-cookie';
import { useAuthStore } from '@/lib/stores/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];
const AUTH_NO_RETRY_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/check-email',
];

function resolvePendingRequests(token: string | null) {
  pendingRequests.forEach((resolve) => resolve(token));
  pendingRequests = [];
}

function redirectTo(path: string) {
  if (globalThis.window !== undefined) {
    globalThis.window.location.href = path;
  }
}

// Request interceptor — attach JWT token and locale to every request
api.interceptors.request.use((config) => {
  const authState = useAuthStore.getState();
  const token = authState.accessToken;
  const activeFarmId = authState.activeFarmId;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Always send active farm context so farm-scoped APIs can resolve tenancy
  // consistently even when farmId is not present in URL/query/body.
  if (activeFarmId) {
    config.headers['x-farm-id'] = activeFarmId;
  }

  // Send the active locale so the API can return localized responses
  if (globalThis.window !== undefined) {
    const locale =
      document.documentElement.lang ||
      globalThis.window.location.pathname.split('/')[1] ||
      'ar';
    config.headers['Accept-Language'] = locale;
    config.headers['x-lang'] = locale;
  }

  return config;
});

// Response interceptor — handle 401 and 403 globally
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      throw error;
    }

    const originalRequest = error.config as RetriableRequestConfig;
    const status = error.response?.status;
    const requestUrl = originalRequest.url ?? '';
    const isRefreshRequest = requestUrl.includes('/auth/refresh');
    const isNoRetryAuthRequest = AUTH_NO_RETRY_PATHS.some((path) =>
      requestUrl.includes(path),
    );

    // 403 Forbidden — user is authenticated but lacks permission for this resource.
    if (status === 403 && !isNoRetryAuthRequest) {
      redirectTo('/forbidden');
      throw error;
    }

    // Keep original auth errors (e.g. invalid credentials) instead of replacing
    // them with a refresh-token failure caused by the interceptor retry flow.
    if (
      status !== 401 ||
      isRefreshRequest ||
      isNoRetryAuthRequest ||
      originalRequest._retry
    ) {
      throw error;
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post<{ accessToken: string }>(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = refreshResponse.data.accessToken;
      useAuthStore.getState().setAccessToken(newToken);
      resolvePendingRequests(newToken);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      };

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token is invalid or expired — session is dead.
      useAuthStore.getState().clearSession();
      clearUserRoleCookie();
      resolvePendingRequests(null);
      // Send to /unauthorized rather than /login so the user gets a clear
      // "session expired" message instead of silently bouncing to login.
      redirectTo('/unauthorized');
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
