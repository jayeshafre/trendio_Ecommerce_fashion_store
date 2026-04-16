import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const useCartStore = create(
  persist(
    immer((set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      setCart: (cart) =>
        set((state) => {
          state.items      = cart.items || [];
          state.totalItems = cart.total_items || 0;
          state.totalPrice = cart.total_price || 0;
        }),

      clearCart: () =>
        set((state) => {
          state.items      = [];
          state.totalItems = 0;
          state.totalPrice = 0;
        }),
    })),
    { name: "trendio-cart" }
  )
);

export default useCartStore;
