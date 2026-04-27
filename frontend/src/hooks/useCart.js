/**
 * useCart.js — React Query hooks for cart module
 *
 *
 * Exports:
 *   useCart()        → fetch current cart (runs on mount if authenticated)
 *   useAddToCart()   → POST /cart/items/
 *   useUpdateQty()   → PATCH /cart/items/{id}/
 *   useRemoveItem()  → DELETE /cart/items/{id}/
 *   useClearCart()   → DELETE /cart/clear/
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { cartApi } from "@api";
import { useAuthStore } from "@store";
import useCartStore from "@store/cartStore";
import { getApiError } from "@utils";

const CART_KEY = ["cart"];

// ── useCart ───────────────────────────────────────────────────
export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCart         = useCartStore((s) => s.setCart);

  return useQuery({
    queryKey: CART_KEY,
    queryFn: async () => {
      const { data } = await cartApi.getCart();
      setCart(data);      // keep Zustand badge count in sync
      return data;
    },
    enabled:   isAuthenticated,
    staleTime: 30 * 1000, // 30s — cart changes often
    retry:     false,
  });
}

// ── useAddToCart ──────────────────────────────────────────────
export function useAddToCart() {
  const queryClient = useQueryClient();
  const setCart     = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: ({ variantId, quantity = 1 }) =>
      cartApi.addItem(variantId, quantity),
    onSuccess: ({ data }) => {
      setCart(data);
      queryClient.setQueryData(CART_KEY, data);
      toast.success("Added to bag!");
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useUpdateQty ──────────────────────────────────────────────
export function useUpdateQty() {
  const queryClient = useQueryClient();
  const setCart     = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: ({ itemId, quantity }) =>
      cartApi.updateQty(itemId, quantity),
    onSuccess: ({ data }) => {
      setCart(data);
      queryClient.setQueryData(CART_KEY, data);
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useRemoveItem ─────────────────────────────────────────────
export function useRemoveItem() {
  const queryClient = useQueryClient();
  const setCart     = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: (itemId) => cartApi.removeItem(itemId),
    onSuccess: ({ data }) => {
      setCart(data);
      queryClient.setQueryData(CART_KEY, data);
      toast("Item removed from bag.", { icon: "🗑️" });
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useClearCart ──────────────────────────────────────────────
export function useClearCart() {
  const queryClient = useQueryClient();
  const setCart     = useCartStore((s) => s.setCart);

  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: ({ data }) => {
      setCart(data);
      queryClient.setQueryData(CART_KEY, data);
      toast("Bag cleared.", { icon: "🗑️" });
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}