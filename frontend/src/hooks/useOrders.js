/**
 * useOrders.js — React Query hooks for orders ONLY
 *
 * Address hooks have moved to useProfile.js (users module)
 *
 * Exports:
 *   useOrders()            → paginated order history
 *   useOrderDetail(id)     → single order (full)
 *   usePlaceOrder()        → POST /orders/
 *   useCancelOrder()       → POST /orders/{id}/cancel/
 *   useAdminOrders()       → GET  /orders/admin/ (admin only)
 *   useAdminUpdateStatus() → PATCH /orders/admin/{id}/status/
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "@api/orders.api";
import { QUERY_KEYS, ROUTES } from "@constants";
import { getApiError } from "@utils";
import useCartStore from "@store/cartStore";

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

// ── usePlaceOrder ─────────────────────────────────────────────
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const clearCart   = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: (payload) => ordersApi.placeOrder(payload),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order/success/${data.id}`);
    },
    onError: (err) => {
      const error = err.response?.data;
      if (error?.stock_errors) {
        error.stock_errors.forEach((e) => {
          toast.error(`${e.product}: ${e.issue}`, { duration: 5000 });
        });
      } else {
        toast.error(getApiError(err));
      }
    },
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