/**
 * auth.api.js — ALL auth-related HTTP calls in one place.
 *
 * Every function maps 1-to-1 with a Django endpoint.
 * Nothing else. No logic here — just axios calls.
 *
 * BASE: /api/v1/auth/  (proxied via vite → localhost:8000)
 */
import axiosClient from "./axiosClient";

export const authApi = {
  // ── Core Auth ────────────────────────────────────────────────
  register: (data) =>
    axiosClient.post("/auth/register/", data),

  login: (data) =>
    axiosClient.post("/auth/login/", data),

  logout: (data) =>
    axiosClient.post("/auth/logout/", data),

  refreshToken: (data) =>
    axiosClient.post("/auth/token/refresh/", data),

  getMe: () =>
    axiosClient.get("/auth/me/"),

  updateMe: (data) =>
    axiosClient.patch("/auth/me/", data),

  // ── OTP ─────────────────────────────────────────────────────
  // POST /api/v1/auth/otp/send/
  // body: { identifier: "9876543210", purpose: "phone_verify" }
  // purpose options: "phone_verify" | "email_verify" | "otp_login" | "password_reset"
  sendOtp: (data) =>
    axiosClient.post("/auth/otp/send/", data),

  // POST /api/v1/auth/otp/verify/
  // body: { identifier: "9876543210", code: "483921", purpose: "phone_verify" }
  verifyOtp: (data) =>
    axiosClient.post("/auth/otp/verify/", data),

  // ── Password ────────────────────────────────────────────────
  // POST /api/v1/auth/password/forgot/
  // body: { email: "user@email.com" }
  forgotPassword: (data) =>
    axiosClient.post("/auth/password/forgot/", data),

  // POST /api/v1/auth/password/reset/
  // body: { email, otp, password, password2 }
  resetPassword: (data) =>
    axiosClient.post("/auth/password/reset/", data),

  // POST /api/v1/auth/password/change/  (authenticated)
  // body: { current_password, new_password, new_password2 }
  changePassword: (data) =>
    axiosClient.post("/auth/password/change/", data),
};