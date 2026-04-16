/**
 * Axios singleton with JWT interceptors.
 * - Attaches Bearer token to every request
 * - Auto-refreshes access token on 401
 * - Redirects to /login on refresh failure
 */
import axios from "axios";
import { API_BASE_URL, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@constants";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ─── Request Interceptor ────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        axiosClient.defaults.headers.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
