/**
 * ProductDetailPage — FIXED
 *
 * Fix: Button label logic
 *   Before: showed "SELECT OPTIONS" when no variant selected — confusing
 *   After:
 *     - No variants at all       → "ADD TO BAG" (works immediately)
 *     - Has variants, none chosen → "SELECT SIZE & COLOR" (clear instruction)
 *     - Has variants, chosen     → "ADD TO BAG"
 *     - Out of stock             → "OUT OF STOCK" (disabled)
 *
 * Fix: Heart (wishlist) button now navigates to login if not authenticated
 *   instead of silently doing nothing
 */
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Heart, Share2, ChevronRight,
  Minus, Plus, RotateCcw, Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProduct } from "@hooks/useProducts";
import { useAuthStore } from "@store";
import ProductImageGallery from "@components/product/ProductImageGallery";
import VariantSelector from "@components/product/VariantSelector";
import { formatCurrency } from "@utils";
import { ROUTES } from "@constants";

// ─── Skeleton ─────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-8 md:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] rounded-2xl" style={{ backgroundColor: "#EDE3D9" }} />
        <div className="space-y-4 pt-4">
          <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-7 w-3/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-5 w-1/3 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-px" style={{ backgroundColor: "#E5DCD3" }} />
          <div className="h-32 rounded-xl" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-14 rounded-xl" style={{ backgroundColor: "#EDE3D9" }} />
        </div>
      </div>
    </div>
  );
}

// ── Button label + disabled state helper ─────────────────────
function getCartButtonState(variants, selectedVariant, isInStock) {
  if (!isInStock) {
    return { label: "OUT OF STOCK", disabled: true };
  }
  if (variants.length === 0) {
    // No variants — simple product, add directly
    return { label: "ADD TO BAG", disabled: false };
  }
  if (!selectedVariant) {
    // Has variants but none selected
    return { label: "SELECT SIZE & COLOR", disabled: false };
  }
  if (selectedVariant.stock === 0) {
    return { label: "OUT OF STOCK", disabled: true };
  }
  return { label: "ADD TO BAG", disabled: false };
}

export default function ProductDetailPage() {
  const { slug }                              = useParams();
  const navigate                              = useNavigate();
  const { data: product, isLoading, error }   = useProduct(slug);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty]                         = useState(1);
  const isAuthenticated                       = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "#F8F5F2" }}
      >
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Product not found.
        </h2>
        <Link to="/shop" className="text-sm underline" style={{ color: "#C2A98A" }}>
          ← Continue shopping
        </Link>
      </div>
    );
  }

  const {
    title, brand, description, category,
    images, variants,
    base_price, sale_price, effective_price, discount_percent,
    is_in_stock, total_stock,
  } = product;

  const displayPrice = selectedVariant?.effective_price || effective_price;
  const displayStock = selectedVariant?.stock ?? total_stock;

  // ── Button state ─────────────────────────────────────────
  const { label: cartLabel, disabled: cartDisabled } = getCartButtonState(
    variants, selectedVariant, is_in_stock
  );

  // ── Add to cart handler ──────────────────────────────────
  const handleAddToCart = () => {
    // If has variants and none selected → scroll up to selector with hint
    if (variants.length > 0 && !selectedVariant) {
      toast("Please select your size and color first.", { icon: "👆" });
      document.getElementById("variant-selector")?.scrollIntoView({
        behavior: "smooth", block: "center",
      });
      return;
    }
    // TODO: wire up cartStore.addItem in Cart module
    toast.success(
      `${qty}× ${title}${selectedVariant ? ` (${selectedVariant.size} / ${selectedVariant.color})` : ""} added to bag!`
    );
  };

  // ── Wishlist handler ─────────────────────────────────────
  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast("Sign in to save to wishlist.", { icon: "❤️" });
      navigate(ROUTES.LOGIN);
      return;
    }
    // TODO: wire up wishlist in Account module
    toast.success("Added to wishlist!");
  };

  // ── Share handler ────────────────────────────────────────
  const handleShare = async () => {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">

        {/* ── Breadcrumb ───────────────────────────── */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs" style={{ color: "#7A6E67" }}>
          <Link to="/" className="hover:text-[#C2A98A] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-[#C2A98A] transition-colors">Shop</Link>
          {category && (
            <>
              <ChevronRight size={12} />
              <Link
                to={`/shop?category=${category.slug}`}
                className="hover:text-[#C2A98A] transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span style={{ color: "#2B2B2B" }}>{title}</span>
        </nav>

        {/* ── Main grid ───────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-[1fr_480px]">

          {/* Left — Image gallery */}
          <ProductImageGallery images={images} title={title} />

          {/* Right — Product info */}
          <div className="flex flex-col">

            {/* Brand */}
            {brand && (
              <p
                className="mb-1 text-[11px] font-bold tracking-widest"
                style={{ color: "#C2A98A" }}
              >
                {brand.toUpperCase()}
              </p>
            )}

            {/* Title */}
            <h1
              className="mb-3 text-2xl font-bold leading-tight lg:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              {title}
            </h1>

            {/* Price */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl font-semibold" style={{ color: "#2B2B2B" }}>
                {formatCurrency(displayPrice)}
              </span>
              {sale_price && (
                <span className="text-base line-through" style={{ color: "#7A6E67" }}>
                  {formatCurrency(base_price)}
                </span>
              )}
              {discount_percent > 0 && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: "#D97757" }}
                >
                  -{discount_percent}%
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mb-5 flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: is_in_stock ? "#84cc16" : "#D97757" }}
              />
              <span className="text-xs" style={{ color: "#7A6E67" }}>
                {is_in_stock
                  ? displayStock <= 5 ? `Only ${displayStock} left` : "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            <div className="border-t" style={{ borderColor: "#E5DCD3" }} />

            {/* Variant selector */}
            {variants.length > 0 && (
              <div id="variant-selector" className="py-5">
                <VariantSelector
                  variants={variants}
                  selectedVariant={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5 flex items-center gap-4">
              <span
                className="text-[10px] font-bold tracking-widest"
                style={{ color: "#2B2B2B" }}
              >
                QTY
              </span>
              <div
                className="flex items-center overflow-hidden rounded-xl border"
                style={{ borderColor: "#E5DCD3" }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#EDE3D9]"
                >
                  <Minus size={14} style={{ color: "#2B2B2B" }} />
                </button>
                <span
                  className="flex h-10 w-10 items-center justify-center text-sm font-medium"
                  style={{ color: "#2B2B2B" }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(displayStock || 10, q + 1))}
                  className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#EDE3D9]"
                >
                  <Plus size={14} style={{ color: "#2B2B2B" }} />
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mb-4 flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cartDisabled}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl py-4 text-xs font-bold tracking-[0.12em] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: cartDisabled
                    ? "#7A6E67"
                    : cartLabel === "SELECT SIZE & COLOR"
                    ? "#C2A98A"
                    : "#2B2B2B",
                }}
              >
                <ShoppingBag size={16} />
                {cartLabel}
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={handleWishlist}
                className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all hover:border-[#C2A98A] hover:bg-[#FDF8F4]"
                style={{ borderColor: "#E5DCD3" }}
                title="Add to wishlist"
              >
                <Heart size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all hover:border-[#C2A98A]"
                style={{ borderColor: "#E5DCD3" }}
                title="Share this product"
              >
                <Share2 size={16} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              </button>
            </div>

            {/* Trust badges */}
            <div
              className="mb-5 flex gap-6 rounded-xl p-4"
              style={{ backgroundColor: "#EDE3D9" }}
            >
              {[
                { icon: <RotateCcw size={14} />, label: "30-day returns" },
                { icon: <Shield size={14} />,     label: "Secure checkout" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "#7A6E67" }}
                >
                  <span style={{ color: "#C2A98A" }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* Description accordion */}
            {description && (
              <details className="group border-t" style={{ borderColor: "#E5DCD3" }}>
                <summary
                  className="flex cursor-pointer items-center justify-between py-4 text-xs font-bold tracking-widest"
                  style={{ color: "#2B2B2B" }}
                >
                  PRODUCT DETAILS
                  <ChevronRight
                    size={14}
                    className="transition-transform group-open:rotate-90"
                    style={{ color: "#7A6E67" }}
                  />
                </summary>
                <p className="pb-4 text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
                  {description}
                </p>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}