/**
 * payments_api.js — all payment HTTP calls
 *
 * POST /payments/create/  → create Razorpay order (step 1)
 * POST /payments/verify/  → verify signature after user pays (step 2)
 * GET  /payments/         → payment history
 */
import axiosClient from "./axiosClient";

export const paymentsApi = {
  createPayment: (order_id) =>
    axiosClient.post("/payments/create/", { order_id }),

  verifyPayment: ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
    axiosClient.post("/payments/verify/", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),

  getPayments: () =>
    axiosClient.get("/payments/"),
};