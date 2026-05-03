/**
 * useRazorpay.js — loads Razorpay checkout script + opens modal
 *
 * Razorpay checkout.js must be loaded from their CDN dynamically.
 * We load it once on hook mount and cache it on window.
 *
 * Exports:
 *   useRazorpay() → { openRazorpayModal, isScriptLoaded }
 *
 * Usage:
 *   const { openRazorpayModal } = useRazorpay();
 *   openRazorpayModal({
 *     key, amount, currency, razorpay_order_id,
 *     name, email, contact, order_number,
 *     onSuccess: ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {},
 *     onFailure: (error) => {},
 *   });
 */
import { useEffect, useState, useCallback } from "react";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src  = RAZORPAY_SCRIPT;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(!!window.Razorpay);

  useEffect(() => {
    if (!window.Razorpay) {
      loadRazorpayScript().then((loaded) => setIsScriptLoaded(loaded));
    }
  }, []);

  const openRazorpayModal = useCallback(({
    key,
    amount,
    currency = "INR",
    razorpay_order_id,
    order_number,
    name,
    email,
    contact,
    onSuccess,
    onFailure,
  }) => {
    if (!window.Razorpay) {
      onFailure?.({ description: "Razorpay script not loaded. Please refresh and try again." });
      return;
    }

    const options = {
      key,
      amount,
      currency,
      name:        "Trendio",
      description: `Order ${order_number}`,
      order_id:    razorpay_order_id,

      // Pre-fill user details
      prefill: {
        name,
        email,
        contact,
      },

      // Ivory Luxe brand theme
      theme: {
        color: "#C2A98A",
      },

      // Called by Razorpay after successful payment
      handler: function (response) {
        onSuccess?.({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_signature:  response.razorpay_signature,
        });
      },

      modal: {
        // Called when user closes the modal without paying
        ondismiss: function () {
          onFailure?.({ description: "Payment cancelled by user." });
        },
        confirm_close: true,  // show confirmation before closing
        escape:        false, // prevent accidental ESC close
      },
    };

    const rzp = new window.Razorpay(options);

    // Handle payment failures (card declined, bank error, etc.)
    rzp.on("payment.failed", function (response) {
      onFailure?.({
        code:        response.error.code,
        description: response.error.description,
        reason:      response.error.reason,
      });
    });

    rzp.open();
  }, []);

  return { openRazorpayModal, isScriptLoaded };
}