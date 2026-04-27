/**
 * cartStore.js — Zustand cart store
 *
 * Source of truth for cart state across the entire app.
 * Synced from the API on every mutation — never trust local math.
 *
 * Save to: src/store/cartStore.js
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set) => ({
      // Full cart object from API
      cart: null,

      // Quick access computed values (derived from cart)
      totalItems: 0,
      subtotal:   "0.00",

      // Set the full cart object returned by the API
      setCart: (cartData) => {
        set({
          cart:       cartData,
          totalItems: cartData?.item_count  ?? 0,
          subtotal:   cartData?.subtotal    ?? "0.00",
        });
      },

      // Clear cart data (on logout)
      clearCart: () => set({ cart: null, totalItems: 0, subtotal: "0.00" }),
    }),
    {
      name: "trendio-cart",
      // Only persist item count for navbar badge — full cart always fetched fresh
      partialize: (state) => ({ totalItems: state.totalItems }),
    }
  )
);

export default useCartStore;