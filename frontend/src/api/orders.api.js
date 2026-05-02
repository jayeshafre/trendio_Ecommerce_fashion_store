/**
 * orders_api.js — order HTTP calls only
 *
 * Addresses have moved to the users module → see users_api.js
 *
 * Endpoints:
 *   GET    /orders/              → order history (paginated)
 *   POST   /orders/              → place order
 *   GET    /orders/{id}/         → order detail
 *   POST   /orders/{id}/cancel/  → cancel order
 *   GET    /orders/admin/        → all orders (admin)
 *   PATCH  /orders/admin/{id}/status/ → update status (admin)
 */
import axiosClient from "./axiosClient";

export const ordersApi = {
  // ── Customer: Orders ──────────────────────────────────────
  getOrders:     (params = {}) => axiosClient.get("/orders/", { params }),
  getOrderDetail:(id)          => axiosClient.get(`/orders/${id}/`),
  placeOrder:    (payload)     => axiosClient.post("/orders/", payload),
  cancelOrder:   (id)          => axiosClient.post(`/orders/${id}/cancel/`),

  // ── Admin ─────────────────────────────────────────────────
  adminGetOrders:    (params = {})     => axiosClient.get("/orders/admin/", { params }),
  adminUpdateStatus: (id, status)      => axiosClient.patch(`/orders/admin/${id}/status/`, { status }),
};