import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_TIMEOUT } from "../config/api";

export { API_BASE_URL };

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("raaz_access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error retrieving auth token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Handle response errors & auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await AsyncStorage.getItem("raaz_refresh_token");
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            refreshToken,
          });
          if (res.data?.success && res.data.token) {
            await AsyncStorage.setItem("raaz_access_token", res.data.token);
            error.config.headers.Authorization = `Bearer ${res.data.token}`;
            return axios(error.config);
          }
        } catch (refreshErr) {
          await AsyncStorage.multiRemove([
            "raaz_access_token",
            "raaz_refresh_token",
            "raaz_user",
          ]);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const AuthAPI = {
  login: (data: any) => api.post("/auth/login", data),
  register: (data: any) => api.post("/auth/register", data),
  checkUsername: (username: string) =>
    api.get(`/auth/check-username?username=${encodeURIComponent(username)}`),
  getProfile: () => api.get("/auth/me"),
  changePassword: (data: any) => api.post("/auth/change-password", data),
  recoverPassword: (data: any) => api.post("/auth/recover-password", data),
  logout: () => api.post("/auth/logout"),
};

export const UserAPI = {
  search: (query: string) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
  getProfile: (id: string) => api.get(`/users/profile/${id}`),
  updateProfile: (data: any) => api.put("/users/profile", data),
  updatePrivacy: (data: any) => api.put("/users/privacy", data),
  updateMood: (data: any) => api.put("/users/mood", data),
  blockUser: (targetUserId: string) => api.post("/users/block", { targetUserId }),
  unblockUser: (targetUserId: string) => api.post("/users/unblock", { targetUserId }),
  registerDeviceToken: (token: string) => api.post("/users/device-token", { token }),
};

export const FriendAPI = {
  getAll: () => api.get("/friends/all"),
  sendRequest: (recipientId: string) => api.post("/friends/request", { recipientId }),
  acceptRequest: (requestId: string) => api.put(`/friends/accept/${requestId}`),
  rejectRequest: (requestId: string) => api.put(`/friends/reject/${requestId}`),
  cancelRequest: (requestId: string) => api.delete(`/friends/cancel/${requestId}`),
  removeFriend: (friendId: string) => api.delete(`/friends/remove/${friendId}`),
};

export const ChatAPI = {
  getConversations: () => api.get("/chat/conversations"),
  getConversationDetails: (conversationId: string) =>
    api.get(`/chat/conversation/${conversationId}`),
  getOrCreateDirect: (recipientId: string) => api.post("/chat/direct", { recipientId }),
  getMessages: (conversationId: string, page = 1) =>
    api.get(`/chat/messages/${conversationId}?page=${page}`),
  sendMessage: (conversationId: string, data: any) =>
    api.post(`/chat/messages/${conversationId}`, data),
  editMessage: (messageId: string, text: string) =>
    api.put(`/chat/messages/${messageId}`, { text }),
  deleteMessage: (messageId: string, forEveryone = false) =>
    api.delete(`/chat/messages/${messageId}`, { data: { forEveryone } }),
  react: (messageId: string, emoji: string) =>
    api.post(`/chat/messages/${messageId}/reaction`, { emoji }),
  togglePin: (messageId: string) => api.put(`/chat/messages/${messageId}/pin`),
  toggleStar: (messageId: string) => api.put(`/chat/messages/${messageId}/star`),
  clearChat: (conversationId: string) =>
    api.post(`/chat/messages/${conversationId}/clear`),
  forwardMessage: (messageId: string, targetConversationId: string) =>
    api.post(`/chat/messages/${messageId}/forward`, { targetConversationId }),
  markDelivered: (conversationId: string, messageIds: string[]) =>
    api.post(`/chat/messages/${conversationId}/delivered`, { messageIds }),
};

export const GroupAPI = {
  create: (data: any) => api.post("/groups/create", data),
  getDetails: (groupId: string) => api.get(`/groups/${groupId}`),
  addMembers: (groupId: string, userIds: string[]) =>
    api.post(`/groups/${groupId}/members`, { userIds }),
  removeMember: (groupId: string, memberId: string) =>
    api.delete(`/groups/${groupId}/members/${memberId}`),
  leaveGroup: (groupId: string) => api.post(`/groups/${groupId}/leave`),
  joinByCode: (code: string) => api.post(`/groups/join/${code}`),
};

export const SecretRoomAPI = {
  create: (data: any) => api.post("/secret-room/create", data),
  join: (code: string) => api.post("/secret-room/join", { code }),
  close: (roomId: string) => api.post(`/secret-room/close/${roomId}`),
};

export const MomentAPI = {
  getFeed: () => api.get("/moments/feed"),
  create: (data: any) => api.post("/moments/create", data),
  view: (momentId: string) => api.post(`/moments/view/${momentId}`),
  react: (momentId: string, emoji: string) =>
    api.post(`/moments/react/${momentId}`, { emoji }),
  delete: (momentId: string) => api.delete(`/moments/${momentId}`),
};

// Vibe is the 24-hour temporary story
export const VibeAPI = MomentAPI;

export const PostAPI = {
  create: (data: any) => api.post("/posts/create", data),
  getFeed: (filter = "for_you", page = 1) =>
    api.get(`/posts/feed?filter=${filter}&page=${page}`),
  getUserPosts: (userId: string, page = 1) =>
    api.get(`/posts/user/${userId}?page=${page}`),
  react: (postId: string, emoji = "❤️") =>
    api.post(`/posts/${postId}/react`, { emoji }),
  votePoll: (postId: string, optionId: string) =>
    api.post(`/posts/${postId}/poll/${optionId}/vote`),
  addComment: (postId: string, text: string, replyTo?: string) =>
    api.post(`/posts/${postId}/comments`, { text, replyTo }),
  getComments: (postId: string) => api.get(`/posts/${postId}/comments`),
  toggleSave: (postId: string) => api.post(`/posts/${postId}/save`),
  edit: (postId: string, data: any) => api.put(`/posts/${postId}`, data),
  delete: (postId: string) => api.delete(`/posts/${postId}`),
};

export const MoodAPI = {
  record: (data: any) => api.post("/mood/record", data),
  getHistory: (limit = 30) => api.get(`/mood/history?limit=${limit}`),
  update: (entryId: string, data: any) => api.put(`/mood/${entryId}`, data),
  delete: (entryId: string) => api.delete(`/mood/${entryId}`),
};

export const NotificationAPI = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

export const CapsuleAPI = {
  create: (data: any) => api.post("/capsules/create", data),
  getMy: () => api.get("/capsules/my"),
  cancel: (capsuleId: string) => api.put(`/capsules/cancel/${capsuleId}`),
};

export const ChatPlayAPI = {
  create: (data: any) => api.post("/chat-play/activity", data),
  vote: (activityId: string, optionId: string) =>
    api.post(`/chat-play/activity/${activityId}/vote`, { optionId }),
  getActivities: (conversationId: string) =>
    api.get(`/chat-play/activities/${conversationId}`),
};

export const ReportAPI = {
  submit: (data: any) => api.post("/reports/submit", data),
  getAll: (status?: string) => api.get(`/reports/admin${status ? `?status=${status}` : ""}`),
  resolve: (reportId: string, data: any) => api.put(`/reports/admin/${reportId}`, data),
};

export const UploadAPI = {
  uploadFile: async (fileUri: string, filename = "upload.jpg", mimeType = "image/jpeg") => {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

/**
 * Super Admin & Platform-Wide Management API
 */
export const AdminAPI = {
  // Metrics & Analytics
  getMetrics: () => api.get("/admin/metrics"),
  getAnalytics: () => api.get("/admin/analytics"),

  // User Management
  getUsers: (params?: any) => api.get("/admin/users", { params }),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),
  updateUser: (userId: string, data: any) => api.put(`/admin/users/${userId}`, data),
  suspendUser: (userId: string, reason = "") =>
    api.put(`/admin/users/${userId}/suspend`, { reason }),
  banUser: (userId: string, banReason = "") =>
    api.put(`/admin/users/${userId}/ban`, { banReason }),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  changeUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),

  // Admins & Roles
  getAdminAccounts: () => api.get("/admin/admins"),

  // Groups Management
  getGroups: (params?: any) => api.get("/admin/groups", { params }),
  getGroupDetails: (groupId: string) => api.get(`/admin/groups/${groupId}`),
  createGroup: (data: any) => api.post("/admin/groups", data),
  updateGroup: (groupId: string, data: any) => api.put(`/admin/groups/${groupId}`, data),
  deleteGroup: (groupId: string) => api.delete(`/admin/groups/${groupId}`),
  addGroupMember: (groupId: string, userId: string) =>
    api.post(`/admin/groups/${groupId}/members`, { userId }),
  removeGroupMember: (groupId: string, memberId: string) =>
    api.delete(`/admin/groups/${groupId}/members/${memberId}`),

  // Moments Moderation
  getMoments: (params?: any) => api.get("/admin/moments", { params }),
  deleteMoment: (momentId: string, reason = "") =>
    api.delete(`/admin/moments/${momentId}`, { data: { reason } }),

  // Notifications Campaigns CRUD
  getNotifications: (params?: any) => api.get("/admin/notifications", { params }),
  createNotification: (data: any) => api.post("/admin/notifications", data),
  updateNotification: (id: string, data: any) => api.put(`/admin/notifications/${id}`, data),
  deleteNotification: (id: string) => api.delete(`/admin/notifications/${id}`),
  sendNotification: (id: string) => api.post(`/admin/notifications/${id}/send`),
  cancelNotification: (id: string) => api.post(`/admin/notifications/${id}/cancel`),

  // System Settings CRUD
  getSettings: () => api.get("/admin/settings"),
  updateSetting: (key: string, data: any) => api.put(`/admin/settings/${key}`, data),

  // CMS Survey Cards CRUD
  getCards: (params?: any) => api.get("/admin/cards", { params }),
  updateCardStatus: (id: string, status: string) =>
    api.put(`/admin/cards/${id}/status`, { status }),
  deleteCard: (id: string) => api.delete(`/admin/cards/${id}`),

  // Reports Moderation
  getReports: (params?: any) => api.get("/reports/admin", { params }),
  resolveReport: (reportId: string, data: any) =>
    api.put(`/reports/admin/${reportId}`, data),

  // Audit Logs
  getAuditLogs: (params?: any) => api.get("/admin/audit-logs", { params }),
};

export default api;
