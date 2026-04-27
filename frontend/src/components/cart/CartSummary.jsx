/**
 * CartSummary — order summary panel on the right side of CartPage.
 *
 * Shows: subtotal, delivery note, total, checkout button
 */
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Truck } from "lucide-react";
import { formatCurrency } from "@utils";
import { ROUTES } from "@constants";

export default function CartSummary({ subtotal, itemCount, hasStockIssues }) {
  const navigate    = useNavigate();
  const sub         = parseFloat(subtotal || 0);
  const freeShipping = sub >= 999;
  const shipping     = freeShipping ? 0 : 99;
  const total        = sub + shipping;

  return (
    <div
      className="sticky top-24 rounded-2xl p-6"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
    >
      <h2
        className="mb-5 text-lg font-bold"
        style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
      >
        Order Summary
      </h2>

      {/* Line items */}
      <div className="space-y-3 border-b pb-4" style={{ borderColor: "#E5DCD3" }}>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: "#7A6E67" }}>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span style={{ color: "#2B2B2B" }}>{formatCurrency(sub)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5" style={{ color: "#7A6E67" }}>
            <Truck size={13} />
            Delivery
          </span>
          {freeShipping ? (
            <span className="text-xs font-semibold" style={{ color: "#84cc16" }}>FREE</span>
          ) : (
            <span style={{ color: "#2B2B2B" }}>{formatCurrency(shipping)}</span>
          )}
        </div>
        {!freeShipping && (
          <p className="text-xs" style={{ color: "#7A6E67" }}>
            Add {formatCurrency(999 - sub)} more for free delivery
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-4 pb-5">
        <span className="text-base font-semibold" style={{ color: "#2B2B2B" }}>Total</span>
        <span className="text-xl font-bold" style={{ color: "#2B2B2B" }}>
          {formatCurrency(total)}
        </span>
      </div>

      {/* Stock issues warning */}
      {hasStockIssues && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-xs"
          style={{ backgroundColor: "#FEF9C3", color: "#854d0e" }}
        >
          Some items have stock issues. Please update quantities before proceeding.
        </div>
      )}

      {/* Checkout button */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.CHECKOUT)}
        disabled={hasStockIssues || itemCount === 0}
        className="w-full rounded-xl py-4 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#2B2B2B" }}
      >
        PROCEED TO CHECKOUT
      </button>

      {/* Trust badges */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "#7A6E67" }}>
        <ShieldCheck size={13} style={{ color: "#C2A98A" }} />
        Secure checkout · 256-bit SSL
      </div>
    </div>
  );
}