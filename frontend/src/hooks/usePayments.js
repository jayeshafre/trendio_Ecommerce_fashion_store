/**
 * usePayments.js — React Query hooks for payments
 *
 * Exports:
 *   useInitiatePayment()  → full payment flow (create + open modal + verify)
 *   usePaymentHistory()   → GET /payments/
 *
 * useInitiatePayment is the main hook — it orchestrates the entire flow:
 *   1. Call POST /payments/create/ → get razorpay_order_id + key
 *   2. Open Razorpay modal
 *   3. On user payment → call POST /payments/verify/
 *   4. On success → invalidate order queries + call onSuccess callback
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentsApi } from "@api/payments.api";
import { useRazorpay } from "./useRazorpay";
import { QUERY_KEYS } from "@constants";
import { getApiError } from "@utils";

// ── useInitiatePayment ────────────────────────────────────────
export function useInitiatePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const { openRazorpayModal }     = useRazorpay();
  const queryClient               = useQueryClient();

  const initiatePayment = async ({ orderId, onSuccess, onFailure }) => {
    setIsLoading(true);

    try {
      // Step 1: Create Razorpay order on backend
      const { data: paymentData } = await paymentsApi.createPayment(orderId);

      // Step 2: Open Razorpay checkout modal
      openRazorpayModal({
        key:               paymentData.key,
        amount:            paymentData.amount,
        currency:          paymentData.currency,
        razorpay_order_id: paymentData.razorpay_order_id,
        order_number:      paymentData.order_number,
        name:              paymentData.name,
        email:             paymentData.email,
        contact:           paymentData.contact,

        // Step 3: On payment success → verify with backend
        onSuccess: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
          try {
            const { data: verifyData } = await paymentsApi.verifyPayment({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            });

            // Invalidate order cache so UI reflects PAID + CONFIRMED
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.ORDERS.DETAIL(paymentData.order_id),
            });

            toast.success("Payment successful! Your order is confirmed.");
            onSuccess?.(verifyData.order);
          } catch (err) {
            const msg = getApiError(err);
            toast.error(`Payment verification failed: ${msg}`);
            onFailure?.({ description: msg });
          } finally {
            setIsLoading(false);
          }
        },

        // Payment failed or user cancelled
        onFailure: (error) => {
          setIsLoading(false);
          if (error?.description === "Payment cancelled by user.") {
            toast("Payment cancelled.", { icon: "ℹ️" });
          } else {
            toast.error(
              error?.description || "Payment failed. Please try again."
            );
          }
          onFailure?.(error);
        },
      });
    } catch (err) {
      setIsLoading(false);
      toast.error(getApiError(err));
      onFailure?.({ description: getApiError(err) });
    }
  };

  return { initiatePayment, isLoading };
}

// ── usePaymentHistory ─────────────────────────────────────────
export function usePaymentHistory() {
  return useQuery({
    queryKey: ["payments"],
    queryFn:  async () => {
      const { data } = await paymentsApi.getPayments();
      return data;
    },
    staleTime: 60 * 1000,
  });
}