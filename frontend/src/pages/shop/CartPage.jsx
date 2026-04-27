/**
 * CartPage — /cart
 *
 * Layout (desktop): left items list + right summary panel
 * Layout (mobile):  stacked — items then summary
 *
 */
import { Link }          from "react-router-dom";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart, useClearCart } from "@hooks/useCart";
import CartItem   from "@components/cart/CartItem";
import CartSummary from "@components/cart/CartSummary";
import PageSpinner from "@components/common/PageSpinner";
import { ROUTES }  from "@constants";

// ── Skeleton ──────────────────────────────────────────────────
function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 rounded-xl p-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}>
          <div className="h-24 w-20 rounded-lg" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-2.5 w-1/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
            <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
            <div className="h-2.5 w-1/3 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const clearCart = useClearCart();

  const items          = cart?.items || [];
  const hasItems       = items.length > 0;
  const hasStockIssues = items.some((i) => i.stock_warning === "out_of_stock" || i.stock_warning === "insufficient_stock");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">

        {/* ── Header ────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              My Bag
            </h1>
            {!isLoading && (
              <p className="mt-0.5 text-sm" style={{ color: "#7A6E67" }}>
                {hasItems
                  ? `${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}`
                  : "Your bag is empty"}
              </p>
            )}
          </div>

          {/* Clear cart — only shown when items exist */}
          {hasItems && (
            <button
              type="button"
              onClick={() => clearCart.mutate()}
              disabled={clearCart.isPending}
              className="text-xs underline transition-opacity hover:opacity-60"
              style={{ color: "#7A6E67" }}
            >
              {clearCart.isPending ? "Clearing…" : "Clear bag"}
            </button>
          )}
        </div>

        {/* ── Loading ──────────────────────────────────── */}
        {isLoading && <CartSkeleton />}

        {/* ── Empty state ──────────────────────────────── */}
        {!isLoading && !hasItems && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "#EDE3D9" }}
            >
              <ShoppingBag size={36} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
            </div>
            <h2
              className="mb-2 text-xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              Your bag is empty
            </h2>
            <p className="mb-8 max-w-xs text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
              Looks like you haven't added anything yet. Start shopping!
            </p>
            <Link
              to={ROUTES.SHOP}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#2B2B2B" }}
            >
              <ShoppingBag size={14} /> BROWSE PRODUCTS
            </Link>
          </div>
        )}

        {/* ── Cart layout ──────────────────────────────── */}
        {!isLoading && hasItems && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

            {/* Left — Items list */}
            <div className="space-y-3">
              {/* Back to shop */}
              <Link
                to={ROUTES.SHOP}
                className="mb-4 flex items-center gap-1.5 text-xs"
                style={{ color: "#7A6E67" }}
              >
                <ArrowLeft size={13} />
                Continue shopping
              </Link>

              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Right — Summary */}
            <CartSummary
              subtotal={cart.subtotal}
              itemCount={cart.item_count}
              hasStockIssues={hasStockIssues}
            />
          </div>
        )}
      </div>
    </div>
  );
}