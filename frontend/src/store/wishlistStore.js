/**
 * wishlistStore.js — Zustand store for wishlist.
 *
 * Persisted to localStorage so wishlist survives page refresh.
 * No backend needed yet — this is frontend-only until Account module.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useWishlistStore = create(
  persist(
    (set, get) => ({
      // items: array of full product objects (from API)
      items: [],

      // Add product — no duplicates
      addItem: (product) => {
        const exists = get().items.some((i) => i.id === product.id);
        if (!exists) {
          set((state) => ({ items: [...state.items, product] }));
        }
      },

      // Remove product by id
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
      },

      // Toggle — add if not present, remove if present
      toggle: (product) => {
        const exists = get().items.some((i) => i.id === product.id);
        if (exists) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      // Check if a product is wishlisted
      isWishlisted: (productId) =>
        get().items.some((i) => i.id === productId),

      // Clear all
      clear: () => set({ items: [] }),
    }),
    {
      name: "trendio-wishlist", // localStorage key
    }
  )
);

export default useWishlistStore;