/**
 * notifications.api.js — all notification HTTP calls
 */
import axiosClient from "./axiosClient";

export const notificationsApi = {
  getAll:       (params = {}) => axiosClient.get("/notifications/", { params }),
  getUnreadCount: ()          => axiosClient.get("/notifications/unread-count/"),
  markRead:     (id)          => axiosClient.patch(`/notifications/${id}/read/`),
  markAllRead:  ()            => axiosClient.post("/notifications/mark-all-read/"),
  delete:       (id)          => axiosClient.delete(`/notifications/${id}/`),
  clearAll:     ()            => axiosClient.delete("/notifications/clear/"),
};