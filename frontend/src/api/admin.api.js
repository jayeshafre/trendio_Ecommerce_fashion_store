/**
 * admin.api.js — all admin-only HTTP calls
 *
 * Dashboard: GET /orders/admin/dashboard/
 * Users:     GET/PATCH /auth/admin/users/
 */
import axiosClient from "./axiosClient";

export const adminApi = {
  // ── Dashboard ─────────────────────────────────────────────
  getDashboard: () =>
    axiosClient.get("/orders/admin/dashboard/"),

  // ── User Management ───────────────────────────────────────
  getUsers: (params = {}) =>
    axiosClient.get("/auth/admin/users/", { params }),

  getUserDetail: (id) =>
    axiosClient.get(`/auth/admin/users/${id}/`),

  toggleUser: (id) =>
    axiosClient.patch(`/auth/admin/users/${id}/toggle/`),
};