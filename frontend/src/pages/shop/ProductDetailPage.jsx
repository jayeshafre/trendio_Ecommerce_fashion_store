/**
 * ProductDetailPage — /product/:slug
 *
 * Layout:
 *   Left  → image gallery
 *   Right → product info, variant selector, add-to-cart CTA
 *
 * Cart integration is stubbed (toast only) — will be wired in Cart module.
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, Heart, Share2, ChevronRight, Minus, Plus, RotateCcw, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useProduct } from "@hooks/useProducts";
import ProductImageGallery from "@components/product/ProductImageGallery";
import VariantSelector from "@components/product/VariantSelector";
import { formatCurrency } from "@utils";

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

export default function ProductDetailPage() {
  const { slug }                            = useParams();
  const { data: product, isLoading, error } = useProduct(slug);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty]                       = useState(1);

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

  // If a specific variant is selected, use its price; else product price
  const displayPrice = selectedVariant?.effective_price || effective_price;
  const displayStock = selectedVariant?.stock ?? total_stock;
  const canAddToCart = is_in_stock && (!variants.length || selectedVariant);

  const handleAddToCart = () => {
    if (variants.length && !selectedVariant) {
      toast.error("Please select a size and color.");
      return;
    }
    // TODO: wire up cartStore.addItem in Cart module
    toast.success(`${qty}× ${title} added to bag!`);
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

            {/* Brand + title */}
            {brand && (
              <p
                className="mb-1 text-[11px] font-bold tracking-widest"
                style={{ color: "#C2A98A" }}
              >
                {brand.toUpperCase()}
              </p>
            )}
            <h1
              className="mb-3 text-2xl font-bold leading-tight lg:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              {title}
            </h1>

            {/* Price */}
            <div className="mb-4 flex items-center gap-3">
              <span
                className="text-2xl font-semibold"
                style={{ color: "#2B2B2B" }}
              >
                {formatCurrency(displayPrice)}
              </span>
              {sale_price && (
                <span
                  className="text-base line-through"
                  style={{ color: "#7A6E67" }}
                >
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
                  ? displayStock <= 5
                    ? `Only ${displayStock} left`
                    : "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            <div className="border-t" style={{ borderColor: "#E5DCD3" }} />

            {/* Variant selector */}
            {variants.length > 0 && (
              <div className="py-5">
                <VariantSelector
                  variants={variants}
                  selectedVariant={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5 flex items-center gap-4">
              <span className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
                QTY
              </span>
              <div
                className="flex items-center gap-0 overflow-hidden rounded-xl border"
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
                disabled={!canAddToCart}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl py-4 text-xs font-bold tracking-[0.12em] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: "#2B2B2B" }}
              >
                <ShoppingBag size={16} />
                {canAddToCart ? "ADD TO BAG" : variants.length ? "SELECT OPTIONS" : "OUT OF STOCK"}
              </button>
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all hover:border-[#C2A98A]"
                style={{ borderColor: "#E5DCD3" }}
              >
                <Heart size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all hover:border-[#C2A98A]"
                style={{ borderColor: "#E5DCD3" }}
              >
                <Share2 size={16} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              </button>
            </div>

            {/* Trust badges */}
            <div
              className="mb-5 flex gap-4 rounded-xl p-4"
              style={{ backgroundColor: "#EDE3D9" }}
            >
              {[
                { icon: <RotateCcw size={14} />, label: "30-day returns" },
                { icon: <Shield size={14} />, label: "Secure checkout" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs" style={{ color: "#7A6E67" }}>
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
                <p
                  className="pb-4 text-sm leading-relaxed"
                  style={{ color: "#7A6E67" }}
                >
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