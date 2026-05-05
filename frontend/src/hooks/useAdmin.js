/**
 * useAdmin.js — React Query hooks for admin panel
 *
 * Exports:
 *   useAdminDashboard()   → full dashboard data
 *   useAdminUsers(params) → paginated user list
 *   useAdminUserDetail(id)→ single user + order summary
 *   useToggleUser()       → PATCH toggle is_active
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi } from "@api/admin.api";
import { getApiError } from "@utils";

// ── Dashboard ─────────────────────────────────────────────────
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await adminApi.getDashboard();
      return data;
    },
    staleTime:       60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ── Users ─────────────────────────────────────────────────────
export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const { data } = await adminApi.getUsers(params);
      return data;
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminUserDetail(id) {
  return useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const { data } = await adminApi.getUserDetail(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useToggleUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => adminApi.toggleUser(id),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(data.message);
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}