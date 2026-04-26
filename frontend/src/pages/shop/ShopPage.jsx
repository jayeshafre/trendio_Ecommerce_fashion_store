/**
 * ShopPage — FIXED
 *
 * Fix: Category nav not working when switching between categories
 *
 * Root cause: filters state was initialized from searchParams ONCE on mount.
 * When user clicked Jeans → T-Shirts in navbar, the URL changed but the
 * filters state didn't update because useSearchParams change doesn't
 * automatically re-run the useState initializer.
 *
 * Fix: Added a useEffect that watches searchParams and syncs filters
 * whenever the URL changes externally (e.g. clicking navbar category links).
 * This means clicking SHIRTS → JEANS → T-SHIRTS all work correctly.
 */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useProducts } from "@hooks/useProducts";
import ProductGrid from "@components/product/ProductGrid";
import FiltersPanel from "@components/product/FiltersPanel";
import Pagination from "@components/common/Pagination";

const SORT_OPTIONS = [
  { label: "Newest",          value: "-created_at" },
  { label: "Price: Low–High", value: "base_price"  },
  { label: "Price: High–Low", value: "-base_price" },
  { label: "Name A–Z",        value: "title"       },
];

// ── Read current URL params into a filters object ─────────────
function readParamsFromURL(searchParams) {
  return {
    category:  searchParams.get("category")  || "",
    brand:     searchParams.get("brand")     || "",
    size:      searchParams.get("size")      || "",
    color:     searchParams.get("color")     || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    in_stock:  searchParams.get("in_stock")  || "",
    search:    searchParams.get("q")         || "",
    ordering:  searchParams.get("ordering")  || "-created_at",
    page:      parseInt(searchParams.get("page") || "1"),
  };
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ── Initialize filters from URL ────────────────────────────
  const [filters, setFilters] = useState(() => readParamsFromURL(searchParams));

  // ── KEY FIX: sync filters when URL changes externally ─────
  // This fires when user clicks Navbar category links, browser back/forward,
  // or any Link that changes search params without going through setFilters.
  useEffect(() => {
    const incoming = readParamsFromURL(searchParams);

    // Only update if something actually changed — prevents infinite loop
    setFilters((prev) => {
      const changed = Object.keys(incoming).some(
        (k) => String(incoming[k]) !== String(prev[k])
      );
      return changed ? incoming : prev;
    });
  }, [searchParams.toString()]); // depend on the stringified params

  // ── Write filters → URL (when user changes filters in sidebar) ─
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== "" && v !== false) {
        // Use "q" for search in the URL (matches navbar search)
        if (k === "search") {
          if (v) params["q"] = v;
        } else if (k !== "page" || v > 1) {
          params[k] = v;
        }
      }
    });
    if (filters.page > 1) params.page = filters.page;
    setSearchParams(params, { replace: true });
  }, [filters]);

  // ── Strip empty values before sending to API ───────────────
  const apiParams = Object.fromEntries(
    Object.entries(filters).filter(([k, v]) => {
      if (k === "search") return false; // search is sent as "q" separately
      return v !== "" && v !== undefined && v !== false;
    })
  );
  // Map "search" → "search" param that django-filter SearchFilter understands
  if (filters.search) apiParams.search = filters.search;

  const { data, isLoading, isFetching } = useProducts(apiParams);
  const products = data?.results || [];
  const count    = data?.count   || 0;

  const activeFilterCount = [
    filters.category,
    filters.size,
    filters.color,
    filters.min_price,
    filters.max_price,
    filters.in_stock,
  ].filter(Boolean).length;

  // ── Page title ─────────────────────────────────────────────
  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : filters.category
    ? filters.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Shop All";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">

        {/* ── Page header ────────────────────────────────── */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              {pageTitle}
            </h1>
            {!isLoading && (
              <p className="mt-0.5 text-sm" style={{ color: "#7A6E67" }}>
                {count} {count === 1 ? "product" : "products"}
                {isFetching && !isLoading && " · Updating…"}
              </p>
            )}
          </div>

          {/* Sort dropdown — desktop */}
          <div className="relative hidden md:block">
            <select
              value={filters.ordering}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, ordering: e.target.value, page: 1 }))
              }
              className="appearance-none rounded-xl border bg-white py-2 pl-4 pr-10 text-sm outline-none transition-all focus:border-[#C2A98A]"
              style={{ borderColor: "#E5DCD3", color: "#2B2B2B" }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#7A6E67" }}
            />
          </div>
        </div>

        {/* ── Mobile toolbar ──────────────────────────────── */}
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium"
            style={{ borderColor: "#E5DCD3", color: "#2B2B2B" }}
          >
            <SlidersHorizontal size={15} style={{ color: "#C2A98A" }} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: "#C2A98A" }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={filters.ordering}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, ordering: e.target.value, page: 1 }))
            }
            className="flex-1 appearance-none rounded-xl border bg-white px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: "#E5DCD3", color: "#2B2B2B" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* ── Main layout ─────────────────────────────────── */}
        <div className="flex gap-8">

          {/* Sidebar — desktop */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <FiltersPanel filters={filters} setFilters={setFilters} />
          </aside>

          {/* Product grid */}
          <main className="flex-1">
            <ProductGrid products={products} isLoading={isLoading} skeletonCount={8} />
            <Pagination
              count={count}
              page={filters.page}
              pageSize={20}
              onChange={(p) => {
                setFilters((prev) => ({ ...prev, page: p }));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </main>
        </div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────── */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: "rgba(43,43,43,0.4)" }}
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl p-6 lg:hidden"
            style={{ backgroundColor: "#F8F5F2" }}
          >
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              onClose={() => setMobileFiltersOpen(false)}
            />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 w-full rounded-xl py-3.5 text-xs font-bold tracking-widest text-white"
              style={{ backgroundColor: "#2B2B2B" }}
            >
              SHOW {count} RESULTS
            </button>
          </div>
        </>
      )}
    </div>
  );
}