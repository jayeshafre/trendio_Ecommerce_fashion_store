import axiosClient from "./axiosClient";

export const cartApi = {
  get:        ()              => axiosClient.get("/cart/"),
  addItem:    (data)          => axiosClient.post("/cart/items/", data),
  updateItem: (itemId, data)  => axiosClient.patch(`/cart/items/${itemId}/`, data),
  removeItem: (itemId)        => axiosClient.delete(`/cart/items/${itemId}/`),
  clear:      ()              => axiosClient.delete("/cart/clear/"),
};
