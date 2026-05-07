/**
 *
 * Features:
 *   - Paginated review list
 *   - Filter by rating (1–5 stars)
 *   - Search by product slug
 *   - Delete any review
 *   - Review stats summary at top
 */
import { useState } from "react";
import { Star, Trash2, Search, X, MessageSquare, AlertTriangle } from "lucide-react";
import { useAdminReviews, useAdminDeleteReview } from "@hooks/useAdmin";

// ── Star display ──────────────────────────────────────────────
function Stars({ rating, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          style={{
            color: n <= rating ? "#C2A98A" : "#E5DCD3",
            fill:  n <= rating ? "#C2A98A" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Rating badge ──────────────────────────────────────────────
function RatingBadge({ rating }) {
  const colors = {
    5: { bg: "#F0FDF4", color: "#16a34a" },
    4: { bg: "#EFF6FF", color: "#2563eb" },
    3: { bg: "#EDE3D9", color: "#C2A98A" },
    2: { bg: "#FFF8EE", color: "#f59e0b" },
    1: { bg: "#FDF3F0", color: "#D97757" },
  };
  const c = colors[rating] || colors[3];
  return (
    <span
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <Star size={8} style={{ fill: c.color, color: c.color }} />
      {rating}.0
    </span>
  );
}

export default function AdminReviews() {
  const [ratingFilter,  setRatingFilter]  = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [dSearch,       setDSearch]       = useState("");
  const [page,          setPage]          = useState(1);
  const [deletingId,    setDeletingId]    = useState(null);

  const { data, isLoading, isError } = useAdminReviews({
    page,
    ...(ratingFilter && { rating:       ratingFilter }),
    ...(dSearch      && { product_slug: dSearch }),
  });

  const deleteReview = useAdminDeleteReview();

  const reviews  = data?.results ?? [];
  const count    = data?.count   ?? 0;
  const hasNext  = !!data?.next;
  const hasPrev  = !!data?.previous;

  // Debounce product search
  const handleSearch = (val) => {
    setProductSearch(val);
    clearTimeout(window._reviewSearchTimer);
    window._reviewSearchTimer = setTimeout(() => {
      setDSearch(val.trim());
      setPage(1);
    }, 400);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setDeletingId(id);
    deleteReview.mutate(id, { onSettled: () => setDeletingId(null) });
  };

  return (
    <div className="py-6 pr-2">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>ADMIN</p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>Reviews</h1>
        {!isLoading && (
          <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>
            {count} review{count !== 1 ? "s" : ""} total
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">

        {/* Product search */}
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ borderColor: "#E5DCD3", backgroundColor: "white" }}
        >
          <Search size={13} style={{ color: "#C2A98A" }} />
          <input
            value={productSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Filter by product slug…"
            className="w-48 bg-transparent text-xs outline-none"
            style={{ color: "#2B2B2B" }}
          />
          {productSearch && (
            <button onClick={() => { setProductSearch(""); setDSearch(""); setPage(1); }}>
              <X size={11} style={{ color: "#7A6E67" }} />
            </button>
          )}
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#7A6E67" }}>Rating:</span>
          {["", "5", "4", "3", "2", "1"].map((r) => (
            <button
              key={r}
              onClick={() => { setRatingFilter(r); setPage(1); }}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                backgroundColor: ratingFilter === r ? "#C2A98A" : "#EDE3D9",
                color:           ratingFilter === r ? "white"   : "#7A6E67",
              }}
            >
              {r === "" ? "All" : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#FDF3F0" }}>
          <AlertTriangle size={28} className="mx-auto mb-2" style={{ color: "#D97757" }} />
          <p className="text-sm" style={{ color: "#D97757" }}>Failed to load reviews.</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <MessageSquare size={44} className="mb-3" style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>No reviews found</p>
          <p className="mt-2 text-sm" style={{ color: "#7A6E67" }}>
            {ratingFilter || dSearch ? "Try adjusting your filters." : "Reviews will appear here once customers submit them."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="card-ivory p-5 transition-shadow hover:shadow-ivory-md"
            >
              <div className="flex items-start gap-4">

                {/* Avatar */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: "#EDE3D9", color: "#C2A98A" }}
                >
                  {review.user_name?.[0]?.toUpperCase() || "?"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                      {review.user_name}
                    </p>
                    <RatingBadge rating={review.rating} />
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: "#EDE3D9", color: "#7A6E67" }}
                    >
                      {review.product_title}
                    </span>
                  </div>

                  <Stars rating={review.rating} />

                  {review.title && (
                    <p className="mt-2 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                      {review.title}
                    </p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
                    {review.body}
                  </p>

                  <p className="mt-2 text-[10px]" style={{ color: "#C0B8B4" }}>
                    {new Date(review.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:bg-[#FDF3F0] disabled:opacity-50"
                  style={{ borderColor: "#E5DCD3", color: "#D97757" }}
                >
                  <Trash2 size={12} />
                  {deletingId === review.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setPage((p) => p - 1)} disabled={!hasPrev}
            className="btn-outline px-5 py-2 disabled:opacity-40">Previous</button>
          <span className="flex items-center px-3 text-sm" style={{ color: "#7A6E67" }}>Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext}
            className="btn-primary px-5 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}