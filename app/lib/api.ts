import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor — tự động gắn JWT token
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    api.post("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data),

  getMe: () => api.get("/auth/me").then((r) => r.data),

  googleMockLogin: (data?: { email?: string; displayName?: string; avatarUrl?: string }) =>
    api.post("/auth/google/mock", data || {}).then((r) => r.data),
};

// Spaces APIs
export const spacesApi = {
  create: (data: {
    title: string;
    description?: string;
    templateCode?: string;
    targetBudget?: number;
    currency?: string;
  }) => api.post("/spaces", data).then((r) => r.data),

  getMySpaces: () => api.get("/spaces").then((r) => r.data),

  getById: (id: string) => api.get(`/spaces/${id}`).then((r) => r.data),

  updateStatus: (
    id: string,
    data: { status: "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED" }
  ) => api.patch(`/spaces/${id}/status`, data).then((r) => r.data),

  updateSettings: (
    id: string,
    data: {
      title?: string;
      description?: string;
      targetBudget?: number;
      coverImageUrl?: string;
    }
  ) => api.patch(`/spaces/${id}/settings`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/spaces/${id}`).then((r) => r.data),
};

// Guests APIs
export const guestsApi = {
  joinAnonymous: (data: { displayName: string; inviteToken: string }) =>
    api.post("/guests/anonymous", data).then((r) => r.data),

  claimAccount: (data: { email: string; password: string }) =>
    api.post("/guests/claim", data).then((r) => r.data),
};

// Share Links APIs
export const shareLinksApi = {
  resolve: (token: string) =>
    api.get(`/s/${token}`).then((r) => r.data),

  regenerate: (spaceId: string) =>
    api.post(`/spaces/${spaceId}/share-links/regenerate`).then((r) => r.data),
};
