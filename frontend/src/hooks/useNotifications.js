/**
 * useNotifications.js — React Query hooks for notifications
 *
 * Exports:
 *   useUnreadCount()      → { count } — polled every 30s for badge
 *   useNotifications()    → paginated list
 *   useMarkRead()         → PATCH single
 *   useMarkAllRead()      → POST mark all
 *   useDeleteNotification → DELETE single
 *   useClearAll()         → DELETE all
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { notificationsApi } from "@api/notifications.api";
import { getApiError } from "@utils";

const KEYS = {
  count: ["notifications-count"],
  list:  (p) => ["notifications", p],
};

// ── Unread count — polled every 30s ──────────────────────────
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey:        KEYS.count,
    queryFn:         async () => {
      const { data } = await notificationsApi.getUnreadCount();
      return data.count;
    },
    enabled,
    staleTime:       15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ── Notification list ─────────────────────────────────────────
export function useNotifications(params = {}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn:  async () => {
      const { data } = await notificationsApi.getAll(params);
      return data;
    },
    staleTime: 15 * 1000,
  });
}

// ── Mark single read ──────────────────────────────────────────
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.count });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Mark all read ─────────────────────────────────────────────
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.count });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── Delete single ─────────────────────────────────────────────
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.count });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── Clear all ─────────────────────────────────────────────────
export function useClearAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.clearAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.count });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications cleared.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}