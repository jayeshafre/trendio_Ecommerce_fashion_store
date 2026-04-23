/**
 * ProductGrid — renders a responsive grid of ProductCards.
 * Handles loading state (skeletons) and empty state.
 */
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import { PackageSearch } from "lucide-react";

export default function ProductGrid({ products = [], isLoading = false, skeletonCount = 8 }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageSearch
          size={48}
          strokeWidth={1}
          className="mb-4"
          style={{ color: "#C2A98A" }}
        />
        <h3
          className="mb-1 text-lg font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
        >
          No products found
        </h3>
        <p className="text-sm" style={{ color: "#7A6E67" }}>
          Try adjusting your filters or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}