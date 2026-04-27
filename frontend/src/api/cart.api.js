/**
 * cart.api.js — all cart HTTP calls
 */
import axiosClient from "./axiosClient";

export const cartApi = {
  getCart:    ()                    => axiosClient.get("/cart/"),
  addItem:    (variant_id, quantity)=> axiosClient.post("/cart/items/", { variant_id, quantity }),
  updateQty:  (itemId, quantity)    => axiosClient.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId)              => axiosClient.delete(`/cart/items/${itemId}/`),
  clearCart:  ()                    => axiosClient.delete("/cart/clear/"),
};