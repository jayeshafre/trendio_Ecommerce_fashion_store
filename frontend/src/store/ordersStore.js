/**
 * ordersStore.js — Zustand store for orders module
 *
 * Lightweight — React Query owns server state.
 * This store only tracks UI-level state:
 *   - Last placed order (for quick access on success page)
 *   - Active checkout address selection
 */
import { create } from "zustand";

const useOrdersStore = create((set) => ({
  // Last successfully placed order (for success page fallback)
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),

  // Selected address during checkout (persisted across re-renders)
  checkoutAddressId: null,
  setCheckoutAddressId: (id) => set({ checkoutAddressId: id }),
}));

export default useOrdersStore;