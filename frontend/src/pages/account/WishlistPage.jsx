/**
 * WishlistPage — FIXED
 *
 * Two fixes:
 * 1. getImageUrl() wraps primary_image so relative paths work
 * 2. Stale localStorage items (saved before fix) that have primary_image=null
 *    are handled gracefully — shows placeholder, prompts user to re-add
 */
import { Link, useNavigate } from "react-router-dom";
import { Heart, X, ShoppingBag, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@store";
import { formatCurrency, getImageUrl } from "@utils";
import { ROUTES } from "@constants";

export default function WishlistPage() {
  const items      = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clear      = useWishlistStore((s) => s.clear);
  const navigate   = useNavigate();

  const handleRemove = (product) => {
    removeItem(product.id);
    toast(`"${product.title}" removed from wishlist.`, { icon: "🗑️" });
  };

  // ── Clear stale items (saved before image fix) ────────────
  // Stale items have primary_image=null AND no images[] array.
  // User is prompted to re-add them from the product page.
  const staleCount = items.filter(
    (p) => !p.primary_image && (!p.images || p.images.length === 0)
  ).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-6">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-0.5 text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}>
              My Wishlist
            </h1>
            <p className="text-sm" style={{ color: "#7A6E67" }}>
              {items.length === 0
                ? "Items you've saved for later."
                : `${items.length} saved ${items.length === 1 ? "item" : "items"}`}
            </p>
          </div>
          {items.length > 0 && (
            <button type="button"
              onClick={() => { clear(); toast("Wishlist cleared."); }}
              className="text-xs underline" style={{ color: "#7A6E67" }}>
              Clear all
            </button>
          )}
        </div>

        {/* Stale items notice — shown when old localStorage data has no images */}
        {staleCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl p-4"
            style={{ backgroundColor: "#FFF8EE", border: "1px solid #C2A98A" }}>
            <RefreshCw size={14} style={{ color: "#C2A98A" }} />
            <p className="text-xs" style={{ color: "#7A6E67" }}>
              Some wishlist items were saved before an update and may not show images.
              Visit each product page and re-add to wishlist to fix this.
            </p>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "#EDE3D9" }}>
              <Heart size={36} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
            </div>
            <h2 className="mb-2 text-xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}>
              Your wishlist is empty
            </h2>
            <p className="mb-8 max-w-xs text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
              Browse the shop and tap the heart icon on any product to save it here.
            </p>
            <Link to={ROUTES.SHOP}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#2B2B2B" }}>
              <ShoppingBag size={14} /> BROWSE PRODUCTS
            </Link>
          </div>
        )}

        {/* Wishlist grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => {
              // ── Resolve image: primary_image field OR first image in array ──
              const rawImage =
                product.primary_image ||
                product.images?.find((img) => img.is_primary)?.image ||
                product.images?.[0]?.image ||
                null;

              const imageUrl = getImageUrl(rawImage); // handles relative & absolute URLs

              return (
                <div key={product.id} className="group relative">

                  {/* Remove button */}
                  <button type="button" onClick={() => handleRemove(product)}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                    title="Remove from wishlist">
                    <X size={13} style={{ color: "#2B2B2B" }} />
                  </button>

                  {/* Product image */}
                  <Link to={`/product/${product.slug}`}>
                    <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl"
                      style={{ backgroundColor: "#EDE3D9" }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="font-display text-4xl italic opacity-20"
                            style={{ color: "#C2A98A" }}>
                            T
                          </span>
                        </div>
                      )}

                      {/* Discount badge */}
                      {product.discount_percent > 0 && (
                        <div className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: "#D97757" }}>
                          -{product.discount_percent}%
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product info */}
                  {product.brand && (
                    <p className="mb-0.5 text-[10px] font-semibold tracking-widest"
                      style={{ color: "#C2A98A" }}>
                      {product.brand.toUpperCase()}
                    </p>
                  )}
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="mb-1.5 text-sm font-medium leading-snug"
                      style={{ color: "#2B2B2B" }}>
                      {product.title}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                      {formatCurrency(product.effective_price || product.base_price)}
                    </span>
                    {product.sale_price && (
                      <span className="text-xs line-through" style={{ color: "#7A6E67" }}>
                        {formatCurrency(product.base_price)}
                      </span>
                    )}
                  </div>

                  {/* View product */}
                  <button type="button"
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="w-full rounded-xl py-2.5 text-[10px] font-bold tracking-widest transition-all hover:opacity-90"
                    style={{ backgroundColor: "#EDE3D9", color: "#2B2B2B" }}>
                    VIEW PRODUCT
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}