/**
 * CartItem — one row in the cart.
 *
 * Fix: product.primary_image passed through getImageUrl()
 * so relative Django media paths like /media/products/image.jpg
 * become http://localhost:8000/media/products/image.jpg
 */
import { useState } from "react";
import { Link }     from "react-router-dom";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useUpdateQty, useRemoveItem } from "@hooks/useCart";
import { formatCurrency, getImageUrl } from "@utils";   // ← getImageUrl added

export default function CartItem({ item }) {
  const { id, product, variant, quantity, price_at_add, line_total, stock_warning } = item;

  const [localQty, setLocalQty] = useState(quantity);

  const updateQty  = useUpdateQty();
  const removeItem = useRemoveItem();

  const isUpdating = updateQty.isPending;
  const isRemoving = removeItem.isPending;
  const isBusy     = isUpdating || isRemoving;

  const handleQtyChange = (newQty) => {
    if (newQty < 1 || newQty > 10 || newQty === localQty) return;
    const prev = localQty;
    setLocalQty(newQty);
    updateQty.mutate(
      { itemId: id, quantity: newQty },
      { onError: () => setLocalQty(prev) }
    );
  };

  const handleRemove = () => removeItem.mutate(id);

  const warningText = {
    out_of_stock:       "Out of stock — remove to continue",
    insufficient_stock: `Only ${variant.stock} left — reduce qty`,
    low_stock:          `Only ${variant.stock} left!`,
  }[stock_warning];

  // ── Resolved image URL ────────────────────────────────────
  const imageUrl = getImageUrl(product.primary_image);  // ← THE FIX

  return (
    <div
      className={`flex gap-4 rounded-xl p-4 transition-opacity ${isRemoving ? "opacity-40" : ""}`}
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5DCD3" }}
    >
      {/* ── Image ─────────────────────────────────────── */}
      <Link to={`/product/${product.slug}`} className="shrink-0">
        <div
          className="h-24 w-20 overflow-hidden rounded-lg"
          style={{ backgroundColor: "#EDE3D9" }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-2xl italic opacity-20" style={{ color: "#C2A98A" }}>
                T
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Info ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {product.brand && (
            <p className="mb-0.5 text-[9px] font-bold tracking-widest" style={{ color: "#C2A98A" }}>
              {product.brand.toUpperCase()}
            </p>
          )}
          <Link to={`/product/${product.slug}`}>
            <h3 className="mb-1 text-sm font-medium leading-snug" style={{ color: "#2B2B2B" }}>
              {product.title}
            </h3>
          </Link>
          <p className="text-xs" style={{ color: "#7A6E67" }}>
            {[variant.size, variant.color].filter(Boolean).join(" · ")}
          </p>
        </div>

        {stock_warning && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: "#D97757" }}>
            <AlertTriangle size={11} />
            {warningText}
          </div>
        )}

        {/* ── Bottom row: qty + price ─────────────────── */}
        <div className="mt-3 flex items-center justify-between">
          {/* Qty controls */}
          <div
            className="flex items-center overflow-hidden rounded-lg border"
            style={{ borderColor: "#E5DCD3" }}
          >
            <button
              type="button"
              onClick={() => handleQtyChange(localQty - 1)}
              disabled={isBusy || localQty <= 1}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-[#EDE3D9] disabled:opacity-40"
            >
              <Minus size={12} style={{ color: "#2B2B2B" }} />
            </button>
            <span
              className="flex h-8 w-8 items-center justify-center text-sm font-medium"
              style={{ color: "#2B2B2B" }}
            >
              {isUpdating ? "…" : localQty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(localQty + 1)}
              disabled={isBusy || localQty >= Math.min(10, variant.stock)}
              className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-[#EDE3D9] disabled:opacity-40"
            >
              <Plus size={12} style={{ color: "#2B2B2B" }} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              {formatCurrency(line_total)}
            </p>
            {localQty > 1 && (
              <p className="text-[10px]" style={{ color: "#7A6E67" }}>
                {formatCurrency(price_at_add)} each
              </p>
            )}
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={isBusy}
            className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#FEF2F2] disabled:opacity-40"
            title="Remove item"
          >
            <Trash2 size={14} style={{ color: "#D97757" }} />
          </button>
        </div>
      </div>
    </div>
  );
}