/**
 * ProductDetailPage.jsx — UPDATED
 * Added: ReviewsSection at the bottom (after SimilarProducts)
 *
 * Reviews features:
 *   - Star rating summary with per-star breakdown bars
 *   - Paginated review list
 *   - Write/Edit review form (shown only if eligible)
 *   - Delete own review
 *   - Rating filter (1★ – 5★)
 */
import { useState }        from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart, Share2, ChevronRight, Minus, Plus,
  RotateCcw, Shield, Star, Edit2, Trash2, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useProduct }       from "@hooks/useProducts";
import { useWishlistStore } from "@store";
import {
  useProductReviews,
  useReviewEligibility,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@hooks/useReviews";
import useAuthStore         from "@store/authStore";
import ProductImageGallery  from "@components/product/ProductImageGallery";
import VariantSelector      from "@components/product/VariantSelector";
import AddToCartButton      from "@components/cart/AddToCartButton";
import { formatCurrency }   from "@utils";
import SimilarProducts      from "@components/product/SimilarProducts";

// ── Normalize product for wishlist ────────────────────────────
function normalizeForWishlist(product) {
  if (product.primary_image) return product;
  const images  = product.images || [];
  const primary = images.find((img) => img.is_primary) || images[0];
  return { ...product, primary_image: primary?.image || primary?.url || null };
}

// ── Star renderer ─────────────────────────────────────────────
function Stars({ rating, size = 14, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          style={{
            color: n <= display ? "#C2A98A" : "#E5DCD3",
            fill:  n <= display ? "#C2A98A" : "none",
            cursor: interactive ? "pointer" : "default",
            transition: "color 0.1s",
          }}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(n)}
        />
      ))}
    </div>
  );
}

// ── Review Form (create + edit) ───────────────────────────────
function ReviewForm({ slug, existingReview, onCancel }) {
  const isEdit = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title,  setTitle]  = useState(existingReview?.title  || "");
  const [body,   setBody]   = useState(existingReview?.body   || "");

  const createReview = useCreateReview(slug);
  const updateReview = useUpdateReview(slug);

  const isPending = createReview.isPending || updateReview.isPending;

  const handleSubmit = () => {
    if (!rating)           { toast.error("Please select a star rating."); return; }
    if (body.trim().length < 10) { toast.error("Review must be at least 10 characters."); return; }

    const payload = { rating, body: body.trim(), title: title.trim() };

    if (isEdit) {
      updateReview.mutate({ id: existingReview.id, ...payload }, { onSuccess: onCancel });
    } else {
      createReview.mutate(payload, { onSuccess: onCancel });
    }
  };

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{ borderColor: "#C2A98A", backgroundColor: "#FAF7F4" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest" style={{ color: "#C2A98A" }}>
          {isEdit ? "EDIT YOUR REVIEW" : "WRITE A REVIEW"}
        </p>
        {onCancel && (
          <button onClick={onCancel}>
            <X size={14} style={{ color: "#7A6E67" }} />
          </button>
        )}
      </div>

      {/* Star picker */}
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
          YOUR RATING *
        </p>
        <Stars rating={rating} size={24} interactive onRate={setRating} />
        {rating > 0 && (
          <p className="mt-1 text-xs" style={{ color: "#C2A98A" }}>
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
          HEADLINE (OPTIONAL)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          placeholder="Summarise your experience…"
          className="input-ivory w-full"
        />
      </div>

      {/* Body */}
      <div>
        <label className="mb-1.5 block text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
          REVIEW *
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Tell others about your experience with this product…"
          className="input-ivory w-full resize-none"
        />
        <p className="mt-1 text-right text-[10px]" style={{ color: "#7A6E67" }}>
          {body.length}/2000
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary flex-1"
        >
          {isPending
            ? (isEdit ? "Saving…" : "Submitting…")
            : (isEdit ? "Save Changes" : "Submit Review")
          }
        </button>
      </div>
    </div>
  );
}

// ── Single Review Card ────────────────────────────────────────
function ReviewCard({ review, currentUserId, slug }) {
  const [editing, setEditing] = useState(false);
  const deleteReview = useDeleteReview(slug);

  const isOwn = review.user_id === currentUserId;

  const handleDelete = () => {
    if (!window.confirm("Delete your review?")) return;
    deleteReview.mutate(review.id);
  };

  if (editing) {
    return (
      <ReviewForm
        slug={slug}
        existingReview={review}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      className="rounded-2xl border p-5 space-y-3"
      style={{ borderColor: "#E5DCD3", backgroundColor: "white" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: "#EDE3D9", color: "#C2A98A" }}
          >
            {review.user_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              {review.user_name}
            </p>
            <p className="text-[10px]" style={{ color: "#7A6E67" }}>
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Own review actions */}
        {isOwn && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#EDE3D9]"
              style={{ color: "#C2A98A" }}
            >
              <Edit2 size={10} /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteReview.isPending}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#FDF3F0]"
              style={{ color: "#D97757" }}
            >
              <Trash2 size={10} /> Delete
            </button>
          </div>
        )}
      </div>

      <Stars rating={review.rating} size={13} />

      {review.title && (
        <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
          {review.title}
        </p>
      )}
      <p className="text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
        {review.body}
      </p>
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────
function ReviewsSection({ slug }) {
  const [page,          setPage]          = useState(1);
  const [ratingFilter,  setRatingFilter]  = useState("");
  const [showForm,      setShowForm]      = useState(false);

  const user      = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;

  const { data: reviewData, isLoading } = useProductReviews(slug, {
    page,
    ...(ratingFilter && { rating: ratingFilter }),
  });

  const { data: eligibility } = useReviewEligibility(slug, isLoggedIn);

  const reviews  = reviewData?.results   ?? [];
  const stats    = reviewData?.stats     ?? { total: 0, avg_rating: 0, rating_counts: {} };
  const hasNext  = !!reviewData?.next;
  const hasPrev  = !!reviewData?.previous;

  const canReview      = eligibility?.can_review;
  const alreadyReviewed = eligibility?.review_id;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6">
      <div className="border-t pt-12" style={{ borderColor: "#E5DCD3" }}>

        {/* Section header */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#C2A98A" }}>
              CUSTOMER FEEDBACK
            </p>
            <h2
              className="font-display text-2xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              Reviews & Ratings
            </h2>
          </div>

          {/* Write review CTA */}
          {isLoggedIn && canReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Star size={14} /> Write a Review
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

          {/* ── Left: Stats ──────────────────────────────── */}
          <div className="space-y-5">

            {/* Average */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: "#FAF7F4", border: "1px solid #E5DCD3" }}
            >
              <p
                className="font-display text-6xl font-bold"
                style={{ color: "#2B2B2B" }}
              >
                {stats.avg_rating || "—"}
              </p>
              <Stars rating={Math.round(stats.avg_rating)} size={16} />
              <p className="mt-2 text-xs" style={{ color: "#7A6E67" }}>
                {stats.total} review{stats.total !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Star breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.rating_counts?.[star] || 0;
                const pct   = stats.total ? Math.round((count / stats.total) * 100) : 0;
                const isActive = ratingFilter === String(star);
                return (
                  <button
                    key={star}
                    onClick={() => {
                      setRatingFilter(isActive ? "" : String(star));
                      setPage(1);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition-colors"
                    style={{
                      backgroundColor: isActive ? "#EDE3D9" : "transparent",
                    }}
                  >
                    <span className="w-3 shrink-0 text-right text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                      {star}
                    </span>
                    <Star size={10} style={{ color: "#C2A98A", fill: "#C2A98A" }} />
                    <div className="flex-1 overflow-hidden rounded-full h-1.5" style={{ backgroundColor: "#E5DCD3" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: "#C2A98A" }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[10px]" style={{ color: "#7A6E67" }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Eligibility messages */}
            {isLoggedIn && !canReview && eligibility && (
              <div
                className="rounded-xl p-4 text-xs"
                style={{
                  backgroundColor: alreadyReviewed ? "#F0FDF4" : "#F8F5F2",
                  color: alreadyReviewed ? "#16a34a" : "#7A6E67",
                }}
              >
                {alreadyReviewed
                  ? "✓ You've reviewed this product."
                  : eligibility.reason}
              </div>
            )}

            {!isLoggedIn && (
              <div className="rounded-xl p-4 text-xs" style={{ backgroundColor: "#F8F5F2", color: "#7A6E67" }}>
                <Link to="/auth/login" className="font-semibold underline" style={{ color: "#C2A98A" }}>
                  Sign in
                </Link>{" "}
                to write a review.
              </div>
            )}
          </div>

          {/* ── Right: Form + Reviews ─────────────────────── */}
          <div className="space-y-5">

            {/* Write review form */}
            {showForm && (
              <ReviewForm
                slug={slug}
                onCancel={() => setShowForm(false)}
              />
            )}

            {/* Active filter badge */}
            {ratingFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#7A6E67" }}>
                  Showing {ratingFilter}★ reviews
                </span>
                <button
                  onClick={() => setRatingFilter("")}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "#EDE3D9", color: "#7A6E67" }}
                >
                  <X size={9} /> Clear
                </button>
              </div>
            )}

            {/* Review list */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-36 rounded-2xl" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div
                className="rounded-2xl py-14 text-center"
                style={{ backgroundColor: "#F8F5F2" }}
              >
                <Star size={32} className="mx-auto mb-3" style={{ color: "#C2A98A" }} strokeWidth={1} />
                <p className="font-display text-lg" style={{ color: "#2B2B2B" }}>
                  {ratingFilter ? `No ${ratingFilter}★ reviews yet` : "No reviews yet"}
                </p>
                <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>
                  {ratingFilter ? "Try a different rating filter." : "Be the first to share your experience."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={user?.id}
                    slug={slug}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {(hasNext || hasPrev) && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!hasPrev}
                  className="btn-outline px-5 py-2 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="flex items-center px-3 text-sm" style={{ color: "#7A6E67" }}>
                  Page {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext}
                  className="btn-primary px-5 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-8 md:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] rounded-2xl" style={{ backgroundColor: "#EDE3D9" }} />
        <div className="space-y-4 pt-4">
          <div className="h-3 w-1/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-7 w-3/4 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-5 w-1/3 rounded" style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-px"              style={{ backgroundColor: "#E5DCD3" }} />
          <div className="h-32 rounded-xl"   style={{ backgroundColor: "#EDE3D9" }} />
          <div className="h-14 rounded-xl"   style={{ backgroundColor: "#EDE3D9" }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug }                            = useParams();
  const { data: product, isLoading, error } = useProduct(slug);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty]                         = useState(1);

  const toggle      = useWishlistStore((s) => s.toggle);
  const items       = useWishlistStore((s) => s.items);
  const isWishlisted = product ? items.some((i) => i.id === product.id) : false;

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "#F8F5F2" }}>
        <h2 className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}>
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

  const handleWishlist = () => {
    const normalized = normalizeForWishlist(product);
    toggle(normalized);
    const nowWishlisted = !isWishlisted;
    toast(nowWishlisted ? "Added to wishlist!" : "Removed from wishlist.", {
      icon: nowWishlisted ? "❤️" : "🗑️",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>

      {/* ── Product detail ───────────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs" style={{ color: "#7A6E67" }}>
          <Link to="/" className="hover:text-[#C2A98A] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-[#C2A98A] transition-colors">Shop</Link>
          {category && (
            <>
              <ChevronRight size={12} />
              <Link to={`/shop?category=${category.slug}`}
                className="hover:text-[#C2A98A] transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span style={{ color: "#2B2B2B" }}>{title}</span>
        </nav>

        {/* Main grid */}
        <div className="grid gap-10 lg:grid-cols-[460px_720px]">

          <ProductImageGallery images={images} title={title} />

          <div className="flex flex-col">
            {brand && (
              <p className="mb-1 text-[11px] font-bold tracking-widest" style={{ color: "#C2A98A" }}>
                {brand.toUpperCase()}
              </p>
            )}

            <h1 className="mb-3 text-2xl font-bold leading-tight lg:text-3xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}>
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
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: "#D97757" }}>
                  -{discount_percent}%
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full"
                style={{ backgroundColor: is_in_stock ? "#84cc16" : "#D97757" }} />
              <span className="text-xs" style={{ color: "#7A6E67" }}>
                {is_in_stock
                  ? displayStock <= 5 ? `Only ${displayStock} left` : "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            <div className="border-t" style={{ borderColor: "#E5DCD3" }} />

            {/* Variants */}
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
              <span className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>QTY</span>
              <div className="flex items-center overflow-hidden rounded-xl border" style={{ borderColor: "#E5DCD3" }}>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#EDE3D9]">
                  <Minus size={14} style={{ color: "#2B2B2B" }} />
                </button>
                <span className="flex h-10 w-10 items-center justify-center text-sm font-medium"
                  style={{ color: "#2B2B2B" }}>
                  {qty}
                </span>
                <button type="button"
                  onClick={() => setQty((q) => Math.min(displayStock || 10, q + 1))}
                  className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[#EDE3D9]">
                  <Plus size={14} style={{ color: "#2B2B2B" }} />
                </button>
              </div>
            </div>

            {/* CTA row */}
            <div className="mb-4 flex gap-3">
              <AddToCartButton product={product} selectedVariant={selectedVariant} quantity={qty} />
              <button type="button" onClick={handleWishlist}
                className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all hover:border-[#C2A98A] z-20"
                style={{
                  borderColor:     isWishlisted ? "#C2A98A" : "#E5DCD3",
                  backgroundColor: isWishlisted ? "#FDF8F4" : "#fff",
                }}>
                <Heart size={18} strokeWidth={1.5}
                  style={{ color: isWishlisted ? "#C2A98A" : "#2B2B2B", fill: isWishlisted ? "#C2A98A" : "none" }} />
              </button>
              <button type="button" onClick={handleShare}
                className="flex h-14 w-14 items-center justify-center rounded-xl border transition-all hover:border-[#C2A98A]"
                style={{ borderColor: "#E5DCD3" }}>
                <Share2 size={16} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mb-5 flex gap-6 rounded-xl p-4" style={{ backgroundColor: "#EDE3D9" }}>
              {[
                { icon: <RotateCcw size={14} />, label: "30-day returns" },
                { icon: <Shield size={14} />,    label: "Secure checkout" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs" style={{ color: "#7A6E67" }}>
                  <span style={{ color: "#C2A98A" }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* Description */}
            {description && (
              <div className="border-t pt-4" style={{ borderColor: "#E5DCD3" }}>
                <p className="py-2 text-xs font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
                  PRODUCT DETAILS
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
                  {description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* ── Similar Products ─────────────────────────────── */}
      
<SimilarProducts productId={product.id} />

      {/* ── Reviews Section ──────────────────────────────── */}
      <ReviewsSection slug={slug} />
    </div>
  );
}