/**
 * ProductImageGallery — image viewer for ProductDetailPage.
 *
 * Features:
 *   - Large main image with zoom-hint cursor
 *   - Thumbnail strip (horizontal scroll on mobile)
 *   - Keyboard + click navigation
 *   - Placeholder when no images
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductImageGallery({ images = [], title = "" }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Sort: primary first
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.order - b.order;
  });

  const prev = () => setActiveIdx((i) => (i === 0 ? sorted.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === sorted.length - 1 ? 0 : i + 1));

  if (!sorted.length) {
    return (
      <div
        className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#EDE3D9" }}
      >
        <span
          className="font-display text-7xl italic opacity-20"
          style={{ color: "#C2A98A" }}
        >
          T
        </span>
      </div>
    );
  }

  const active = sorted[activeIdx];

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse">

      {/* ── Main image ─────────────────────────────── */}
      <div className="relative flex-1">
        <div
          className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl"
          style={{ backgroundColor: "#EDE3D9" }}
        >
          <img
            key={active.image}
            src={active.image}
            alt={active.alt_text || title}
            className="h-full w-full object-cover transition-opacity duration-300"
          />

          {/* Prev / Next arrows — only if multiple images */}
          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
              >
                <ChevronLeft size={18} style={{ color: "#2B2B2B" }} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
              >
                <ChevronRight size={18} style={{ color: "#2B2B2B" }} />
              </button>
            </>
          )}

          {/* Image count dot */}
          {sorted.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {sorted.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeIdx ? 20 : 6,
                    backgroundColor:
                      i === activeIdx ? "#C2A98A" : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Thumbnail strip ─────────────────────────── */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:w-20 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 scrollbar-hide">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all lg:h-20 lg:w-full"
              style={{
                border:
                  i === activeIdx
                    ? "2px solid #C2A98A"
                    : "1.5px solid #E5DCD3",
                opacity: i === activeIdx ? 1 : 0.7,
              }}
            >
              <img
                src={img.image}
                alt={img.alt_text || `View ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}