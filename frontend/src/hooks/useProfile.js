/**
 * useProfile.js — React Query hooks for user profile + addresses
 *
 * Addresses now live in the users module → /auth/addresses/
 * Backend returns a plain array (no pagination wrapper) so .map() works directly.
 *
 * Exports:
 *   useMe()             → GET  /auth/me/
 *   useUpdateProfile()  → PATCH /auth/me/
 *   useChangePassword() → POST /auth/password/change/
 *
 *   useAddresses()      → GET  /auth/addresses/   ← plain array []
 *   useCreateAddress()  → POST /auth/addresses/
 *   useUpdateAddress()  → PATCH /auth/addresses/{id}/
 *   useDeleteAddress()  → DELETE /auth/addresses/{id}/
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "@api/users_api";
import { useAuthStore } from "@store";
import { QUERY_KEYS } from "@constants";
import { getApiError } from "@utils";

const ADDRESSES_KEY = ["addresses"];

// ── useMe ─────────────────────────────────────────────────────
export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn:  async () => {
      const { data } = await usersApi.getMe();
      return data;
    },
    enabled:   isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

// ── useUpdateProfile ──────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData) => usersApi.updateMe(profileData),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(QUERY_KEYS.AUTH.ME, data);
      toast.success("Profile updated successfully.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── useChangePassword ─────────────────────────────────────────
export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => usersApi.changePassword(data),
    onSuccess: ({ data }) => {
      toast.success(data.message || "Password changed successfully.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── useAddresses ──────────────────────────────────────────────
// Backend returns plain array [] — no pagination wrapper.
// Safe default is [] so .map() never crashes.
export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn:  async () => {
      const { data } = await usersApi.getAddresses();
      // Guarantee array — guards against any unexpected response shape
      return Array.isArray(data) ? data : [];
    },
    enabled:   isAuthenticated,
    staleTime: 60 * 1000,
  });
}

// ── useCreateAddress ──────────────────────────────────────────
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => usersApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
      toast.success("Address saved.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── useUpdateAddress ──────────────────────────────────────────
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => usersApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
      toast.success("Address updated.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── useDeleteAddress ──────────────────────────────────────────
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => usersApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
      toast("Address removed.", { icon: "🗑️" });
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}