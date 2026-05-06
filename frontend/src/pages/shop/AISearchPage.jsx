import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Loader2 }       from "lucide-react";
import { aiApi }          from "@api";
import { formatCurrency } from "@utils";

function ProductCard({ product }) {
  const price    = product.sale_price || product.base_price;
  const imageUrl = product.primary_image
    ? `http://localhost:8000/media/${product.primary_image.replace(/\\/g, "/")}`
    : null;

  return (
    <Link to={`/product/${product.slug}`} className="group">
      {/* Image */}
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl"
        style={{ backgroundColor: "#EDE3D9" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs"
            style={{ color: "#7A6E67" }}>No image</div>
        )}
        {product.sale_price && (
          <span className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: "#D97757" }}>
            SALE
          </span>
        )}
      </div>

      {/* Info */}
      {product.brand && (
        <p className="mb-0.5 text-[10px] font-bold tracking-widest"
          style={{ color: "#C2A98A" }}>
          {product.brand.toUpperCase()}
        </p>
      )}
      <p className="mb-1 line-clamp-2 text-sm font-medium leading-snug"
        style={{ color: "#2B2B2B" }}>
        {product.title}
      </p>
      <p className="text-[10px] mb-1" style={{ color: "#7A6E67" }}>
        {product.category_name}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
          {formatCurrency(price)}
        </span>
        {product.sale_price && (
          <span className="text-xs line-through" style={{ color: "#7A6E67" }}>
            {formatCurrency(product.base_price)}
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-2xl mb-3" style={{ backgroundColor: "#EDE3D9" }} />
      <div className="h-2.5 w-1/4 rounded mb-2" style={{ backgroundColor: "#EDE3D9" }} />
      <div className="h-3 w-3/4 rounded mb-2" style={{ backgroundColor: "#EDE3D9" }} />
      <div className="h-3 w-1/3 rounded" style={{ backgroundColor: "#EDE3D9" }} />
    </div>
  );
}

export default function AISearchPage() {
  const [searchParams]          = useSearchParams();
  const query                   = searchParams.get("q") || "";
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(false);

    aiApi.search(query, 12)
      .then((res) => setResults(res.data.results || []))
      .catch(() => setResults([]))
      .finally(() => {
        setLoading(false);
        setSearched(true);
      });
  }, [query]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Search size={14} style={{ color: "#C2A98A" }} />
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#C2A98A" }}>
              AI SEARCH RESULTS
            </p>
          </div>
          <h1 className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}>
            {query ? `Results for "${query}"` : "Search"}
          </h1>
          {searched && !loading && (
            <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>
              {results.length} {results.length === 1 ? "product" : "products"} found
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Loader2 size={14} className="animate-spin" style={{ color: "#C2A98A" }} />
              <p className="text-sm" style={{ color: "#7A6E67" }}>
                Finding the best matches...
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Search size={40} style={{ color: "#E5DCD3" }} />
            <p className="text-lg font-bold" style={{ color: "#2B2B2B" }}>
              No results found
            </p>
            <p className="text-sm text-center max-w-sm" style={{ color: "#7A6E67" }}>
              We couldn't find anything for "{query}". Try different keywords.
            </p>
            <Link to="/shop"
              className="mt-2 rounded-full px-6 py-2.5 text-xs font-bold tracking-widest text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#2B2B2B" }}>
              BROWSE ALL PRODUCTS
            </Link>
          </div>
        )}

        {/* Empty state — no query */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Search size={40} style={{ color: "#E5DCD3" }} />
            <p className="text-sm" style={{ color: "#7A6E67" }}>
              Type something in the search bar to find products.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}