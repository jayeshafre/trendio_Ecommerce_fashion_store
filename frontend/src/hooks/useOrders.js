/**
 * useOrders.js — React Query hooks for orders
 *
 * NOTE: usePlaceOrder is intentionally removed.
 * CheckoutPage now calls ordersApi.placeOrder() directly so it can
 * immediately chain the Razorpay modal after order creation —
 * a useMutation onSuccess callback fires too late for this flow.
 *
 * Exports:
 *   useOrders()            → paginated order history
 *   useOrderDetail(id)     → single order (full)
 *   useCancelOrder()       → POST /orders/{id}/cancel/
 *   useAdminOrders()       → GET  /orders/admin/ (admin only)
 *   useAdminUpdateStatus() → PATCH /orders/admin/{id}/status/
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ordersApi } from "@api/orders.api";
import { QUERY_KEYS } from "@constants";
import { getApiError } from "@utils";

// ── useOrders ─────────────────────────────────────────────────
export function useOrders(params = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ORDERS.ALL, params],
    queryFn:  async () => {
      const { data } = await ordersApi.getOrders(params);
      return data;
    },
    staleTime: 30 * 1000,
  });
}

// ── useOrderDetail ────────────────────────────────────────────
export function useOrderDetail(id) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(id),
    queryFn:  async () => {
      const { data } = await ordersApi.getOrderDetail(id);
      return data;
    },
    enabled:   !!id,
    staleTime: 15 * 1000,
  });
}

// ── useCancelOrder ────────────────────────────────────────────
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => ordersApi.cancelOrder(orderId),
    onSuccess: ({ data }, orderId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId) });
      toast.success(data.message || "Order cancelled successfully.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── useAdminOrders ────────────────────────────────────────────
export function useAdminOrders(params = {}) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn:  async () => {
      const { data } = await ordersApi.adminGetOrders(params);
      return data;
    },
    staleTime: 15 * 1000,
  });
}

// ── useAdminUpdateStatus ──────────────────────────────────────
export function useAdminUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => ordersApi.adminUpdateStatus(id, status),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      toast.success(data.message || "Order status updated.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}