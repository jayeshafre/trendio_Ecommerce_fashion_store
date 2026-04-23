/**
 * ProductCard — Ivory Luxe theme.
 *
 * Shows: primary image, brand, title, price + discount badge,
 * available sizes as small pills, add-to-wishlist hover icon.
 *
 * Used in: ProductGrid (shop page), HomePage (featured section)
 */
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatCurrency } from "@utils";

// 🔥 Helper to fix image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://127.0.0.1:8000${path}`;
};

// ─── Skeleton loader ─────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 aspect-[3/4] rounded-xl" style={{ backgroundColor: "#EDE3D9" }} />
      <div className="mb-1.5 h-2.5 w-1/3 rounded" style={{ backgroundColor: "#EDE3D9" }} />
      <div className="mb-2 h-3 w-3/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
      <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
    </div>
  );
}

export default function ProductCard({ product }) {
  const {
    slug,
    title,
    brand,
    primary_image,
    base_price,
    sale_price,
    effective_price,
    discount_percent,
    available_sizes = [],
    is_in_stock,
  } = product;

  return (
    <Link to={`/product/${slug}`} className="group relative block">
      {/* ── Image container ──────────────────────────── */}
      <div
        className="relative mb-3 overflow-hidden rounded-xl aspect-[3/4]"
        style={{ backgroundColor: "#EDE3D9" }}
      >
        {primary_image ? (
          <img
            src={getImageUrl(primary_image)}   // ✅ FIX APPLIED HERE
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="text-4xl font-display italic opacity-20"
              style={{ color: "#C2A98A" }}
            >
              T
            </span>
          </div>
        )}

        {/* Discount badge */}
        {discount_percent > 0 && (
          <div
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "#D97757" }}
          >
            -{discount_percent}%
          </div>
        )}

        {/* Out of stock overlay */}
        {!is_in_stock && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(248,245,242,0.75)" }}
          >
            <span
              className="text-[10px] font-bold tracking-widest"
              style={{ color: "#7A6E67" }}
            >
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
        >
          <Heart size={14} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Product info ─────────────────────────────── */}
      <div>
        {brand && (
          <p
            className="mb-0.5 text-[10px] font-semibold tracking-widest"
            style={{ color: "#C2A98A" }}
          >
            {brand.toUpperCase()}
          </p>
        )}

        <h3
          className="mb-1.5 text-sm font-medium leading-snug"
          style={{ color: "#2B2B2B" }}
        >
          {title}
        </h3>

        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
            {formatCurrency(effective_price)}
          </span>
          {sale_price && (
            <span className="text-xs line-through" style={{ color: "#7A6E67" }}>
              {formatCurrency(base_price)}
            </span>
          )}
        </div>

        {available_sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {available_sizes.slice(0, 5).map((size) => (
              <span
                key={size}
                className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                style={{
                  backgroundColor: "#EDE3D9",
                  color: "#7A6E67",
                }}
              >
                {size}
              </span>
            ))}
            {available_sizes.length > 5 && (
              <span className="text-[9px]" style={{ color: "#7A6E67" }}>
                +{available_sizes.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}