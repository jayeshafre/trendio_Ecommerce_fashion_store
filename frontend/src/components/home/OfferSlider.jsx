/**
 * OfferSlider — Men's category banner slider (image left, offer text right)
 * Full body visible, tall enough to show model properly.
 *
 * To swap images: replace the `image` URL in each slide with your own asset/S3 URL.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

// ── Men's wear slides only ─────────────────────────────────────────────────────
const SLIDES = [
  {
    id:       1,
    category: "MEN'S COLLECTION",
    brand:    "Shirts & Casuals",
    offer:    "Up To 40% Off",
    sub:      "Premium linen, cotton & more. Styles built to last.",
    cta:      { label: "+ Explore Shirts", to: "/shop?category=shirts" },
    // Full-body men's fashion shot — replace with your own
    image:    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1400&q=85&fit=crop&crop=top",
    bg:       "#F8F5F2",
    textDark: "#2B2B2B",
    textMid:  "#7A6E67",
    accent:   "#2B2B2B",
    tag:      "#C2A98A",
    // object-position controls which part of image is shown
    imgPos:   "center top",
  },
  {
    id:       2,
    category: "MEN'S DENIM",
    brand:    "Jeans & Trousers",
    offer:    "Up To 35% Off",
    sub:      "Slim fit, straight cut & relaxed — find your perfect pair.",
    cta:      { label: "+ Explore Jeans", to: "/shop?category=jeans" },
    image:    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=85&fit=crop&crop=top",
    bg:       "#EDE3D9",
    textDark: "#2B2B2B",
    textMid:  "#7A6E67",
    accent:   "#2B2B2B",
    tag:      "#C2A98A",
    imgPos:   "center 20%",
  },
  {
    id:       3,
    category: "MEN'S ESSENTIALS",
    brand:    "T-Shirts & Polos",
    offer:    "Buy 2 Get 1 Free",
    sub:      "Everyday comfort meets clean, modern style.",
    cta:      { label: "+ Explore T-Shirts", to: "/shop?category=t-shirts" },
    image:    "https://images.unsplash.com/photo-1603189343302-e603f7add05a?w=1400&q=85&fit=crop&crop=top",
    bg:       "#F0EBE4",
    textDark: "#2B2B2B",
    textMid:  "#7A6E67",
    accent:   "#2B2B2B",
    tag:      "#C2A98A",
    imgPos:   "center 15%",
  },
  {
    id:       4,
    category: "NEW ARRIVALS",
    brand:    "Summer 2026",
    offer:    "Fresh Drops Weekly",
    sub:      "Be the first to wear what everyone will want this season.",
    cta:      { label: "+ See New Arrivals", to: "/shop?ordering=-created_at" },
    image:    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1400&q=85&fit=crop&crop=top",
    bg:       "#2B2B2B",
    textDark: "#F8F5F2",
    textMid:  "#A89880",
    accent:   "#F8F5F2",
    tag:      "#C2A98A",
    imgPos:   "center 10%",
  },
];

const AUTOPLAY_MS = 5000;

export default function OfferSlider() {
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);
  const pausedRef             = useRef(false);
  const timerRef              = useRef(null);

  const goTo = useCallback((idx) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 380);
  }, [current]);

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) next();
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: slide.bg,
        transition: "background-color 0.5s ease",
      }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div
        className="flex flex-col md:flex-row"
        style={{ minHeight: "580px" }}   
      >

        {/* LEFT — Photo (70% width, full height) ───────────────────── */}
        <div
          className="relative overflow-hidden md:w-[70%]"
          style={{ minHeight: "580px" }}
        >
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.category}
            className="absolute inset-0 h-full w-full"
            style={{
              objectFit:      "cover",
              objectPosition: slide.imgPos,   // show chest+body, not just face
              opacity:        fading ? 0 : 1,
              transform:      fading ? "scale(1.04)" : "scale(1)",
              transition:     "opacity 0.38s ease, transform 0.38s ease",
            }}
          />
          {/* Gradient blend into right text panel */}
          <div
            className="absolute inset-y-0 right-0 w-32 hidden md:block"
            style={{
              background: `linear-gradient(to right, transparent, ${slide.bg})`,
            }}
          />
        </div>

        {/* RIGHT — Offer text (30% width) ────────────────────────────── */}
        <div
          className="flex flex-col justify-center px-10 py-14 md:w-[30%] md:pl-4 md:pr-14"
          style={{
            opacity:    fading ? 0 : 1,
            transform:  fading ? "translateY(12px)" : "translateY(0)",
            transition: "opacity 0.38s ease, transform 0.38s ease",
          }}
        >
          {/* Category label */}
          <p
            className="mb-3 text-[9px] font-black tracking-[0.35em]"
            style={{ color: slide.tag }}
          >
            {slide.category}
          </p>

          {/* Collection name */}
          <h2
            className="mb-4 leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   "clamp(2.2rem, 3.5vw, 3.4rem)",
              fontWeight: 700,
              color:      slide.textDark,
              lineHeight: 1.1,
            }}
          >
            {slide.brand}
          </h2>

          {/* Offer pill */}
          <div
            className="mb-5 inline-flex w-fit items-center rounded-full px-4 py-1.5"
            style={{
              backgroundColor: slide.tag + "22",
              border:          `1px solid ${slide.tag}55`,
            }}
          >
            <span className="text-sm font-bold" style={{ color: slide.tag }}>
              {slide.offer}
            </span>
          </div>

          {/* Sub text */}
          <p
            className="mb-8 text-sm leading-relaxed"
            style={{ color: slide.textMid, maxWidth: "210px" }}
          >
            {slide.sub}
          </p>

          {/* CTA link */}
          <Link
            to={slide.cta.to}
            className="group inline-flex w-fit items-center gap-2 text-sm font-semibold transition-all hover:gap-3"
            style={{ color: slide.accent }}
          >
            {slide.cta.label}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* ── Prev arrow ─────────────────────────────────────────────── */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white"
        style={{ color: "#2B2B2B" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* ── Next arrow ─────────────────────────────────────────────── */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white"
        style={{ color: "#2B2B2B" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Dot navigation ─────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 z-10">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width:           i === current ? "26px" : "7px",
              height:          "7px",
              borderRadius:    "9999px",
              backgroundColor: "#C2A98A",
              opacity:         i === current ? 1 : 0.35,
              transition:      "all 0.3s ease",
              border:          "none",
              cursor:          "pointer",
              padding:         0,
            }}
          />
        ))}
      </div>

      {/* ── Progress bar ───────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-full"
        style={{ backgroundColor: "#C2A98A", opacity: 0.15 }}
      >
        <div
          key={current}
          className="h-full"
          style={{
            backgroundColor: "#C2A98A",
            animation:       `sliderProgress ${AUTOPLAY_MS}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes sliderProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}