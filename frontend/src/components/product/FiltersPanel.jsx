/**
 * FiltersPanel — sidebar for ShopPage.
 *
 * Controls:
 *   Category (from API)
 *   Price range (min/max sliders)
 *   Size pills
 *   Color swatches
 *   In-stock toggle
 *
 * All state lives in ShopPage via `filters` + `setFilters`.
 * This component is purely presentational — no internal state.
 */
import { X } from "lucide-react";
import { useCategories } from "@hooks/useProducts";
import { formatCurrency } from "@utils";

const SIZES  = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  { label: "Black",  hex: "#1a1a1a" },
  { label: "White",  hex: "#f5f5f0" },
  { label: "Navy",   hex: "#1e3a5f" },
  { label: "Grey",   hex: "#9ca3af" },
  { label: "Beige",  hex: "#d4b896" },
  { label: "Brown",  hex: "#7c5c3e" },
  { label: "Red",    hex: "#dc2626" },
  { label: "Green",  hex: "#15803d" },
];

// ─── Section heading ─────────────────────────────────────────
function FilterSection({ title, children }) {
  return (
    <div className="border-b py-5" style={{ borderColor: "#E5DCD3" }}>
      <p
        className="mb-3 text-[10px] font-bold tracking-widest"
        style={{ color: "#2B2B2B" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

export default function FiltersPanel({ filters, setFilters, onClose }) {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.results || [];

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const toggleSize = (size) => {
    const current = filters.size === size ? "" : size;
    updateFilter("size", current);
  };

  const toggleColor = (color) => {
    const current = filters.color === color ? "" : color;
    updateFilter("color", current);
  };

  const clearAll = () =>
    setFilters({ page: 1, ordering: "-created_at" });

  const hasActiveFilters =
    filters.category ||
    filters.size ||
    filters.color ||
    filters.min_price ||
    filters.max_price ||
    filters.in_stock;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: "#2B2B2B" }}
        >
          Filters
        </span>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs underline"
              style={{ color: "#C2A98A" }}
            >
              Clear all
            </button>
          )}
          {/* Close button — mobile only */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden"
              style={{ color: "#7A6E67" }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category ─────────────────────────────────── */}
      <FilterSection title="CATEGORY">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => updateFilter("category", "")}
            className="block w-full text-left text-sm transition-colors"
            style={{
              color: !filters.category ? "#C2A98A" : "#7A6E67",
              fontWeight: !filters.category ? 600 : 400,
            }}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => updateFilter("category", cat.slug)}
              className="block w-full text-left text-sm transition-colors"
              style={{
                color: filters.category === cat.slug ? "#C2A98A" : "#7A6E67",
                fontWeight: filters.category === cat.slug ? 600 : 400,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ── Price Range ──────────────────────────────── */}
      <FilterSection title="PRICE RANGE">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="flex flex-1 items-center overflow-hidden rounded-lg border"
              style={{ borderColor: "#E5DCD3" }}
            >
              <span
                className="px-2 text-xs"
                style={{ color: "#7A6E67" }}
              >
                ₹
              </span>
              <input
                type="number"
                placeholder="Min"
                value={filters.min_price || ""}
                onChange={(e) =>
                  updateFilter("min_price", e.target.value || undefined)
                }
                className="w-full bg-transparent py-2 pr-2 text-sm outline-none"
                style={{ color: "#2B2B2B" }}
              />
            </div>
            <span style={{ color: "#7A6E67" }}>—</span>
            <div
              className="flex flex-1 items-center overflow-hidden rounded-lg border"
              style={{ borderColor: "#E5DCD3" }}
            >
              <span
                className="px-2 text-xs"
                style={{ color: "#7A6E67" }}
              >
                ₹
              </span>
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price || ""}
                onChange={(e) =>
                  updateFilter("max_price", e.target.value || undefined)
                }
                className="w-full bg-transparent py-2 pr-2 text-sm outline-none"
                style={{ color: "#2B2B2B" }}
              />
            </div>
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Under ₹500",  min: undefined, max: 500 },
              { label: "₹500–₹1500", min: 500,       max: 1500 },
              { label: "₹1500–₹3000",min: 1500,      max: 3000 },
              { label: "Above ₹3000", min: 3000,      max: undefined },
            ].map(({ label, min, max }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    min_price: min,
                    max_price: max,
                    page: 1,
                  }))
                }
                className="rounded-full px-2.5 py-1 text-[10px] font-medium transition-all"
                style={{
                  backgroundColor:
                    filters.min_price == min && filters.max_price == max
                      ? "#C2A98A"
                      : "#EDE3D9",
                  color:
                    filters.min_price == min && filters.max_price == max
                      ? "#fff"
                      : "#7A6E67",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* ── Size ─────────────────────────────────────── */}
      <FilterSection title="SIZE">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className="h-9 w-9 rounded-lg text-xs font-medium transition-all duration-150"
              style={
                filters.size === size
                  ? { backgroundColor: "#2B2B2B", color: "#fff" }
                  : { backgroundColor: "#EDE3D9", color: "#7A6E67" }
              }
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ── Color ────────────────────────────────────── */}
      <FilterSection title="COLOR">
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map(({ label, hex }) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleColor(label.toLowerCase())}
              title={label}
              className="relative h-7 w-7 rounded-full transition-all duration-150"
              style={{
                backgroundColor: hex,
                border:
                  filters.color === label.toLowerCase()
                    ? "2.5px solid #C2A98A"
                    : "1.5px solid #E5DCD3",
                boxShadow:
                  filters.color === label.toLowerCase()
                    ? "0 0 0 2px #F8F5F2"
                    : "none",
              }}
            />
          ))}
        </div>
      </FilterSection>

      {/* ── In Stock toggle ──────────────────────────── */}
      <div className="py-5">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
            IN STOCK ONLY
          </span>
          <div
            className="relative h-5 w-9 rounded-full transition-colors duration-200"
            style={{ backgroundColor: filters.in_stock ? "#C2A98A" : "#E5DCD3" }}
          >
            <div
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
              style={{
                transform: filters.in_stock ? "translateX(16px)" : "translateX(2px)",
              }}
            />
            <input
              type="checkbox"
              className="sr-only"
              checked={!!filters.in_stock}
              onChange={(e) => updateFilter("in_stock", e.target.checked || undefined)}
            />
          </div>
        </label>
      </div>
    </div>
  );
}