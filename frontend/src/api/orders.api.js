import axiosClient from "./axiosClient";

export const ordersApi = {
  getAll:   (params) => axiosClient.get("/orders/", { params }),
  getById:  (id)     => axiosClient.get(`/orders/${id}/`),
  create:   (data)   => axiosClient.post("/orders/", data),
  cancel:   (id)     => axiosClient.post(`/orders/${id}/cancel/`),
};
