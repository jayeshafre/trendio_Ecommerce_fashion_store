/**
 * users_api.js — user profile + address HTTP calls
 *
 * All under /api/v1/auth/ (users module)
 *
 * Profile:
 *   GET    /auth/me/              → current user
 *   PATCH  /auth/me/              → update name/phone
 *   POST   /auth/password/change/ → change password
 *
 * Addresses:
 *   GET    /auth/addresses/        → list (plain array)
 *   POST   /auth/addresses/        → create
 *   PATCH  /auth/addresses/{id}/   → update
 *   DELETE /auth/addresses/{id}/   → delete
 */
import axiosClient from "./axiosClient";

export const usersApi = {
  // ── Profile ───────────────────────────────────────────────
  getMe:           ()       => axiosClient.get("/auth/me/"),
  updateMe:        (data)   => axiosClient.patch("/auth/me/", data),
  changePassword:  (data)   => axiosClient.post("/auth/password/change/", data),

  // ── Addresses ─────────────────────────────────────────────
  getAddresses:    ()       => axiosClient.get("/auth/addresses/"),
  createAddress:   (data)   => axiosClient.post("/auth/addresses/", data),
  updateAddress:   (id, data) => axiosClient.patch(`/auth/addresses/${id}/`, data),
  deleteAddress:   (id)     => axiosClient.delete(`/auth/addresses/${id}/`),
};