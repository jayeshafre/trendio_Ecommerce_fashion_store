/**
 * HomePage — /
 *
 * Sections:
 *   1. Hero banner — editorial Ivory Luxe style
 *   2. Category pills — horizontally scrollable
 *   3. Featured products — latest 8 from API
 *   4. Brand promise strip
 */
import { Link } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";
import { useProducts, useCategories } from "@hooks/useProducts";
import ProductGrid from "@components/product/ProductGrid";

export default function HomePage() {
  const { data: productsData, isLoading } = useProducts({ ordering: "-created_at", page: 1 });
  const { data: categoriesData }          = useCategories();

  const products   = productsData?.results?.slice(0, 8) || [];
  const categories = categoriesData?.results || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative flex min-h-[70vh] items-center overflow-hidden"
        style={{ backgroundColor: "#EDE3D9" }}
      >
        {/* Decorative serif letter */}
        <div
          className="pointer-events-none absolute -right-8 bottom-0 select-none font-display text-[20rem] font-bold italic leading-none opacity-[0.06]"
          style={{ color: "#2B2B2B" }}
          aria-hidden
        >
          T
        </div>

        <div className="relative mx-auto w-full max-w-[1400px] px-6 py-16 md:px-12">
          <p
            className="mb-3 text-[10px] font-bold tracking-[0.3em]"
            style={{ color: "#C2A98A" }}
          >
            NEW COLLECTION · 2026
          </p>
          <h1
            className="mb-6 max-w-xl text-5xl font-bold leading-[1.1] md:text-6xl lg:text-7xl"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
          >
            Dress the way
            <br />
            <span style={{ color: "#C2A98A", fontStyle: "italic" }}>you feel.</span>
          </h1>
          <p
            className="mb-8 max-w-md text-base leading-relaxed"
            style={{ color: "#7A6E67" }}
          >
            Curated fashion, crafted for the everyday. Discover styles that
            move with you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#2B2B2B" }}
            >
              SHOP NOW <ArrowRight size={14} />
            </Link>
            <Link
              to="/shop?category=men"
              className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-xs font-bold tracking-[0.15em] transition-all hover:border-[#C2A98A]"
              style={{ borderColor: "#C2A98A", color: "#C2A98A" }}
            >
              MEN'S EDIT
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
            >
              Shop by Category
            </h2>
            <Link
              to="/shop"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "#C2A98A" }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all hover:border-[#C2A98A] hover:text-[#C2A98A]"
                style={{ borderColor: "#E5DCD3", color: "#2B2B2B", backgroundColor: "#fff" }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
          >
            New Arrivals
          </h2>
          <Link
            to="/shop"
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "#C2A98A" }}
          >
            See all <ArrowRight size={12} />
          </Link>
        </div>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          skeletonCount={8}
        />
      </section>

      {/* ── Brand promise strip ──────────────────────── */}
      <section
        className="mt-10 border-t"
        style={{ borderColor: "#E5DCD3", backgroundColor: "#fff" }}
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y px-6 py-8 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          style={{ divideColor: "#E5DCD3" }}
        >
          {[
            { icon: <Truck size={20} />,      title: "Free Shipping",    sub: "On orders above ₹999" },
            { icon: <RotateCcw size={20} />,  title: "Easy Returns",     sub: "30-day hassle-free returns" },
            { icon: <Shield size={20} />,     title: "Secure Payments",  sub: "256-bit SSL encryption" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4 py-5 sm:justify-center sm:px-8">
              <div style={{ color: "#C2A98A" }}>{icon}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>{title}</p>
                <p className="text-xs" style={{ color: "#7A6E67" }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}