/**
 * HomePage — /
 *
 * Sections:
 *   1. OfferSlider   — category-wise banner (image + offer text)
 *   2. Featured products — latest 8 from API
 *   3. Brand promise strip
 */
import { Link } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";
import { useProducts } from "@hooks/useProducts";
import ProductGrid from "@components/product/ProductGrid";
import OfferSlider from "@components/home/OfferSlider";

export default function HomePage() {
  const { data: productsData, isLoading } = useProducts({ ordering: "-created_at", page: 1 });

  const products = productsData?.results?.slice(0, 8) || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>

      {/* ── Offer Slider ─────────────────────────────── */}
      <OfferSlider />

      {/* ── Featured Products ────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-6">
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
        <div
          className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y px-6 py-8 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          style={{ divideColor: "#E5DCD3" }}
        >
          {[
            { icon: <Truck size={20} />,     title: "Free Shipping",   sub: "On orders above ₹999" },
            { icon: <RotateCcw size={20} />, title: "Easy Returns",    sub: "30-day hassle-free returns" },
            { icon: <Shield size={20} />,    title: "Secure Payments", sub: "256-bit SSL encryption" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-4 py-5 sm:justify-center sm:px-8">
              <div style={{ color: "#C2A98A" }}>{icon}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>{title}</p>
                <p className="text-xs"               style={{ color: "#7A6E67" }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}