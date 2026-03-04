import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085";

let accessToken: string | null = (typeof window !== "undefined") ? localStorage.getItem("at") : null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("at", token);
      console.log("[Auth] Token saved to localStorage");
    } else {
      localStorage.removeItem("at");
      console.log("[Auth] Token cleared from localStorage");
    }
  }
};

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor: Add Authorization header if token exists
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    // console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} (With Token)`);
  } else {
    // console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} (No Token)`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;

    // Custom logging for easier debugging
    if (status === 401) {
      console.warn(`[API 401] ${originalRequest?.method?.toUpperCase()} ${url}`);
    } else if (error.message === "Network Error") {
      console.error(`[API Network Error] Check if backend is running on ${API_URL}`);
    } else {
      console.error(`[API Error] ${url}: ${error.message}`, error.response?.data);
    }

    // Skip redirection logic if we're already on the login page or registering
    const isNoRedirectPage = typeof window !== "undefined" && 
      (window.location.pathname.includes("/login") || window.location.pathname.includes("/register") || window.location.pathname === "/");
    
    const isAuthRequest = url?.includes("/auth/");

    // If 401 and not an auth request, try to refresh
    if (status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        console.log("[Auth] Attempting token refresh...");
        const res = await apiClient.post<{ access_token: string }>("/auth/refresh");
        console.log("[Auth] Refresh successful, retrying...");
        setAccessToken(res.data.access_token);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error("[Auth] Session expired, redirecting to login.");
        setAccessToken(null);
        if (typeof window !== "undefined" && !isNoRedirectPage) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
