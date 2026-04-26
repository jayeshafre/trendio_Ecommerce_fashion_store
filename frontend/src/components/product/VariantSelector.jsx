/**
 * VariantSelector — FIXED
 *
 * Fix 1: Duplicate key error
 *   Was:  key={size}          → "32" key appears twice if data has whitespace variance
 *   Now:  key={`size-${i}`}   → index-based key, always unique
 *   Same fix applied to color swatches: key={`color-${i}`}
 *
 * Fix 2: Better UX messaging
 *   Shows "Choose size" / "Choose color" hints instead of nothing
 */
import { useState } from "react";

export default function VariantSelector({ variants = [], selectedVariant, onSelect }) {
  const [selectedSize,  setSelectedSize]  = useState(selectedVariant?.size  || "");
  const [selectedColor, setSelectedColor] = useState(selectedVariant?.color || "");

  // ── Unique sizes — deduplicated, trimmed ──────────────────
  const sizes = [...new Set(
    variants
      .filter((v) => v.is_active && v.size)
      .map((v) => v.size.trim())
  )];

  // ── Unique colors — deduplicated by color name ────────────
  const colors = [...new Map(
    variants
      .filter((v) => v.is_active && v.color)
      .map((v) => [v.color.trim().toLowerCase(), {
        color:     v.color.trim(),
        color_hex: v.color_hex?.trim() || "#ccc",
      }])
  ).values()];

  // ── Availability checks ───────────────────────────────────
  const isSizeAvailable = (size) =>
    variants.some(
      (v) =>
        v.size?.trim() === size &&
        v.is_active &&
        v.stock > 0 &&
        (selectedColor ? v.color?.trim().toLowerCase() === selectedColor.toLowerCase() : true)
    );

  const isColorAvailable = (color) =>
    variants.some(
      (v) =>
        v.color?.trim().toLowerCase() === color.toLowerCase() &&
        v.is_active &&
        v.stock > 0 &&
        (selectedSize ? v.size?.trim() === selectedSize : true)
    );

  // ── Resolve and emit matching variant ─────────────────────
  const resolveVariant = (size, color) => {
    const match = variants.find(
      (v) =>
        v.size?.trim()  === size &&
        v.color?.trim().toLowerCase() === color.toLowerCase() &&
        v.is_active
    );
    onSelect(match || null);
  };

  const handleSizeClick = (size) => {
    const next = selectedSize === size ? "" : size;
    setSelectedSize(next);
    resolveVariant(next, selectedColor);
  };

  const handleColorClick = (color) => {
    const next = selectedColor.toLowerCase() === color.toLowerCase() ? "" : color;
    setSelectedColor(next);
    resolveVariant(selectedSize, next);
  };

  return (
    <div className="space-y-5">

      {/* ── Sizes ──────────────────────────────────────────── */}
      {sizes.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
              SIZE
            </p>
            <span className="text-xs" style={{ color: "#C2A98A" }}>
              {selectedSize || "Choose a size"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* FIX: key uses index, not just size value */}
            {sizes.map((size, i) => {
              const available = isSizeAvailable(size);
              const active    = selectedSize === size;
              return (
                <button
                  key={`size-${i}`}
                  type="button"
                  onClick={() => available && handleSizeClick(size)}
                  disabled={!available}
                  className="relative h-10 min-w-[2.5rem] rounded-lg px-3 text-sm font-medium transition-all duration-150"
                  style={
                    active
                      ? { backgroundColor: "#2B2B2B", color: "#fff", border: "1px solid #2B2B2B" }
                      : available
                      ? { backgroundColor: "#fff",    color: "#2B2B2B", border: "1px solid #E5DCD3" }
                      : { backgroundColor: "#F8F5F2", color: "#D4CAC4", border: "1px solid #E5DCD3", cursor: "not-allowed" }
                  }
                >
                  {/* Strikethrough line for unavailable sizes */}
                  {!available && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                      <span className="absolute w-full rotate-[-20deg] border-t" style={{ borderColor: "#D4CAC4" }} />
                    </span>
                  )}
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Colors ─────────────────────────────────────────── */}
      {colors.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
              COLOR
            </p>
            <span className="text-xs" style={{ color: "#C2A98A" }}>
              {selectedColor || "Choose a color"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {/* FIX: key uses index, not just color name */}
            {colors.map(({ color, color_hex }, i) => {
              const available = isColorAvailable(color);
              const active    = selectedColor.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={`color-${i}`}
                  type="button"
                  title={color}
                  onClick={() => available && handleColorClick(color)}
                  disabled={!available}
                  className="h-8 w-8 rounded-full transition-all duration-150"
                  style={{
                    backgroundColor: color_hex,
                    border:      active ? "2.5px solid #C2A98A" : "1.5px solid #E5DCD3",
                    boxShadow:   active ? "0 0 0 2px #F8F5F2"  : "none",
                    opacity:     available ? 1 : 0.35,
                    cursor:      available ? "pointer" : "not-allowed",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stock status ────────────────────────────────────── */}
      {selectedVariant && (
        <p className="text-xs" style={{
          color: selectedVariant.stock > 5
            ? "#84cc16"
            : selectedVariant.stock > 0
            ? "#D97757"
            : "#ef4444"
        }}>
          {selectedVariant.stock > 0
            ? selectedVariant.stock > 5
              ? `${selectedVariant.stock} in stock`
              : `Only ${selectedVariant.stock} left!`
            : "Out of stock for this option"}
        </p>
      )}
    </div>
  );
}