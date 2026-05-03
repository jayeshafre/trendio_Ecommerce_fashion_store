/**
 * PaymentButton.jsx — reusable Pay Now button
 *
 * Used in:
 *   - OrderSuccessPage (primary use)
 *   - OrderDetailPage  (for UNPAID orders)
 *
 * Props:
 *   orderId      → order UUID
 *   totalAmount  → display amount (string/number)
 *   onSuccess    → called after payment verified (receives updated order)
 *   onFailure    → called on payment failure
 *   className    → optional extra classes
 *   variant      → "primary" | "outline"
 */
import { CreditCard } from "lucide-react";
import { useInitiatePayment } from "@hooks/usePayments";

export default function PaymentButton({
  orderId,
  totalAmount,
  onSuccess,
  onFailure,
  className = "",
  variant   = "primary",
}) {
  const { initiatePayment, isLoading } = useInitiatePayment();

  const handleClick = () => {
    initiatePayment({ orderId, onSuccess, onFailure });
  };

  const baseClass = variant === "outline" ? "btn-outline" : "btn-primary";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClass} ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Opening Payment…
        </span>
      ) : (
        <>
          <CreditCard size={14} />
          Pay ₹{parseFloat(totalAmount).toLocaleString("en-IN")}
        </>
      )}
    </button>
  );
}