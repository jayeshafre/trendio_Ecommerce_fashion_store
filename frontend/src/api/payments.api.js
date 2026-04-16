import axiosClient from "./axiosClient";

export const paymentsApi = {
  createOrder:  (data) => axiosClient.post("/payments/create-order/", data),
  verifyPayment:(data) => axiosClient.post("/payments/verify/", data),
};
