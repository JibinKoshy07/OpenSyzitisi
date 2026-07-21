import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
};

const API_URL = getApiUrl();

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data;
          useAuthStore.getState().setTokens(accessToken, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { username: string; email: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const usersService = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
  search: (query: string) => api.get(`/users/search?q=${query}`),
  getOnline: () => api.get('/users/online'),
  updateProfile: (data: { displayName?: string; bio?: string }) =>
    api.patch('/users/profile', data),
  updateStatus: (status: string) => api.patch('/users/status', { status }),
  uploadAvatar: (formData: FormData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const channelsService = {
  getAll: () => api.get('/channels'),
  getPublic: () => api.get('/channels/public'),
  getById: (id: string) => api.get(`/channels/${id}`),
  create: (data: { name: string; description?: string; type?: string }) =>
    api.post('/channels', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/channels/${id}`, data),
  delete: (id: string) => api.delete(`/channels/${id}`),
  addMembers: (id: string, memberIds: string[]) =>
    api.post(`/channels/${id}/members`, { memberIds }),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/channels/${id}/members/${memberId}`),
  join: (channelId: string) => api.post('/channels/join', { channelId }),
  leave: (id: string) => api.post(`/channels/${id}/leave`),
  addAdmin: (id: string, userId: string) =>
    api.post(`/channels/${id}/admins`, { userId }),
  pinMessage: (id: string, messageId: string) =>
    api.post(`/channels/${id}/pin/${messageId}`),
  unpinMessage: (id: string, messageId: string) =>
    api.delete(`/channels/${id}/pin/${messageId}`),
  getOrCreateDM: (userId: string) => api.get(`/channels/dm/${userId}`),
  search: (query: string) => api.get(`/channels/search?q=${query}`),
};

export const messagesService = {
  getByChannel: (channelId: string, limit = 50, before?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    return api.get(`/messages/channel/${channelId}?${params}`);
  },
  create: (data: { channelId: string; content: string; replyTo?: string; attachments?: any[] }) =>
    api.post('/messages', data),
  update: (id: string, content: string) => api.patch(`/messages/${id}`, { content }),
  delete: (id: string) => api.delete(`/messages/${id}`),
  addReaction: (id: string, emoji: string) =>
    api.post(`/messages/${id}/reaction`, { emoji }),
  removeReaction: (id: string, emoji: string) =>
    api.delete(`/messages/${id}/reaction`, { data: { emoji } }),
  markAsRead: (id: string) => api.post(`/messages/${id}/read`),
  search: (query: string, channelId?: string) => {
    const params = new URLSearchParams({ query });
    if (channelId) params.append('channelId', channelId);
    return api.get(`/messages/search?${params}`);
  },
};

export const notificationsService = {
  getAll: (limit = 50) => api.get(`/notifications?limit=${limit}`),
  getUnread: () => api.get('/notifications/unread'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const filesService = {
  upload: (formData: FormData, channelId?: string, messageId?: string) => {
    const params = new URLSearchParams();
    if (channelId) params.append('channelId', channelId);
    if (messageId) params.append('messageId', messageId);
    return api.post(`/files/upload?${params}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getByChannel: (channelId: string, limit = 50) =>
    api.get(`/files/channel/${channelId}?limit=${limit}`),
  search: (query: string) => api.get(`/files/search?q=${query}`),
  getById: (id: string) => api.get(`/files/${id}`),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const searchService = {
  search: (query: string) => api.get(`/search?q=${query}`),
  searchUsers: (query: string) => api.get(`/search/users?q=${query}`),
  searchChannels: (query: string) => api.get(`/search/channels?q=${query}`),
  searchMessages: (query: string, channelId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (channelId) params.append('channelId', channelId);
    return api.get(`/search/messages?${params}`);
  },
  searchFiles: (query: string) => api.get(`/search/files?q=${query}`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  createUser: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post('/admin/users', data),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  resetPassword: (userId: string, newPassword: string) =>
    api.post(`/admin/users/${userId}/reset-password`, { userId, newPassword }),
  disableUser: (userId: string) => api.post(`/admin/users/${userId}/disable`),
  enableUser: (userId: string) => api.post(`/admin/users/${userId}/enable`),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  getAllChannels: () => api.get('/admin/channels'),
  deleteChannel: (channelId: string) => api.delete(`/admin/channels/${channelId}`),
};
