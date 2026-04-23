/**
 * Pagination — used by ShopPage and SearchPage.
 *
 * Props:
 *   count     → total number of results (from API)
 *   page      → current page (1-indexed)
 *   pageSize  → items per page (default 20, matches backend PAGE_SIZE)
 *   onChange  → (newPage) => void
 */
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ count = 0, page = 1, pageSize = 20, onChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  // Build page numbers to show: always show first, last, current ±1
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const btnBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    minWidth: 36,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    transition: "all .15s",
    cursor: "pointer",
    border: "1px solid #E5DCD3",
    backgroundColor: "#fff",
    color: "#7A6E67",
  };

  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      {/* Prev */}
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={{
          ...btnBase,
          opacity: page === 1 ? 0.4 : 1,
          cursor: page === 1 ? "not-allowed" : "pointer",
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-9 items-center justify-center text-sm"
            style={{ color: "#7A6E67" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            style={{
              ...btnBase,
              backgroundColor: p === page ? "#2B2B2B" : "#fff",
              color: p === page ? "#fff" : "#7A6E67",
              borderColor: p === page ? "#2B2B2B" : "#E5DCD3",
            }}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        style={{
          ...btnBase,
          opacity: page === totalPages ? 0.4 : 1,
          cursor: page === totalPages ? "not-allowed" : "pointer",
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}