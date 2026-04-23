/**
 * VariantSelector — size + color picker on the ProductDetailPage.
 *
 * Props:
 *   variants        → array of ProductVariant objects from API
 *   selectedVariant → currently selected variant (or null)
 *   onSelect        → (variant) => void
 *
 * Logic:
 *   - Extracts unique sizes and colors from variants
 *   - Greys out size/color combos with zero stock
 *   - Selecting a size + color finds the exact matching variant
 */
import { useState } from "react";

export default function VariantSelector({ variants = [], selectedVariant, onSelect }) {
  const [selectedSize,  setSelectedSize]  = useState(selectedVariant?.size  || "");
  const [selectedColor, setSelectedColor] = useState(selectedVariant?.color || "");

  // Unique sizes across all active variants
  const sizes = [...new Set(
    variants.filter((v) => v.is_active).map((v) => v.size).filter(Boolean)
  )];

  // Unique colors
  const colors = [...new Map(
    variants
      .filter((v) => v.is_active)
      .filter((v) => v.color)
      .map((v) => [v.color, { color: v.color, color_hex: v.color_hex }])
  ).values()];

  // Check if a size is available for currently selected color
  const isSizeAvailable = (size) => {
    const matches = variants.filter(
      (v) =>
        v.size === size &&
        v.is_active &&
        (selectedColor ? v.color === selectedColor : true)
    );
    return matches.some((v) => v.stock > 0);
  };

  // Check if a color is available for currently selected size
  const isColorAvailable = (color) => {
    const matches = variants.filter(
      (v) =>
        v.color === color &&
        v.is_active &&
        (selectedSize ? v.size === selectedSize : true)
    );
    return matches.some((v) => v.stock > 0);
  };

  // Find and emit the matching variant
  const resolveVariant = (size, color) => {
    const match = variants.find(
      (v) =>
        v.size === size &&
        v.color === color &&
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
    const next = selectedColor === color ? "" : color;
    setSelectedColor(next);
    resolveVariant(selectedSize, next);
  };

  return (
    <div className="space-y-5">
      {/* ── Sizes ──────────────────────────────────── */}
      {sizes.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
              SIZE
            </p>
            {selectedSize && (
              <span className="text-xs" style={{ color: "#C2A98A" }}>
                {selectedSize}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const active    = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => available && handleSizeClick(size)}
                  disabled={!available}
                  className="relative h-10 min-w-[2.5rem] rounded-lg px-3 text-sm font-medium transition-all duration-150"
                  style={
                    active
                      ? { backgroundColor: "#2B2B2B", color: "#fff", borderColor: "#2B2B2B", border: "1px solid" }
                      : available
                      ? { backgroundColor: "#fff", color: "#2B2B2B", border: "1px solid #E5DCD3" }
                      : { backgroundColor: "#F8F5F2", color: "#D4CAC4", border: "1px solid #E5DCD3", cursor: "not-allowed" }
                  }
                >
                  {!available && (
                    /* Strikethrough line for unavailable */
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <span
                        className="absolute w-full rotate-[-20deg] border-t"
                        style={{ borderColor: "#D4CAC4" }}
                      />
                    </span>
                  )}
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Colors ─────────────────────────────────── */}
      {colors.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
              COLOR
            </p>
            {selectedColor && (
              <span className="text-xs" style={{ color: "#C2A98A" }}>
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {colors.map(({ color, color_hex }) => {
              const available = isColorAvailable(color);
              const active    = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => available && handleColorClick(color)}
                  disabled={!available}
                  className="h-8 w-8 rounded-full transition-all duration-150"
                  style={{
                    backgroundColor: color_hex || "#ccc",
                    border: active ? "2.5px solid #C2A98A" : "1.5px solid #E5DCD3",
                    boxShadow: active ? "0 0 0 2px #F8F5F2" : "none",
                    opacity: available ? 1 : 0.35,
                    cursor: available ? "pointer" : "not-allowed",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status */}
      {selectedVariant && (
        <p className="text-xs" style={{ color: selectedVariant.stock > 5 ? "#84cc16" : "#D97757" }}>
          {selectedVariant.stock > 0
            ? selectedVariant.stock > 5
              ? `${selectedVariant.stock} in stock`
              : `Only ${selectedVariant.stock} left!`
            : "Out of stock"}
        </p>
      )}
    </div>
  );
}