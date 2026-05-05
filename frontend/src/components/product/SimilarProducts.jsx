import { useEffect, useState } from "react";
import { Link }                from "react-router-dom";
import { aiApi }               from "@api";
import { formatCurrency }      from "@utils";

export default function SimilarProducts({ productId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!productId) return;

    aiApi.getSimilarProducts(productId, 4)
      .then((res) => setProducts(res.data.similar_products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-6">
        <p className="mb-6 text-xs font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
          YOU MAY ALSO LIKE
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl mb-3" style={{ backgroundColor: "#EDE3D9" }} />
              <div className="h-3 w-3/4 rounded mb-2" style={{ backgroundColor: "#EDE3D9" }} />
              <div className="h-3 w-1/3 rounded" style={{ backgroundColor: "#EDE3D9" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="border-t mx-auto max-w-[1400px] px-4 py-10 md:px-6"
      style={{ borderColor: "#E5DCD3" }}>
      <p className="mb-6 text-xs font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
        YOU MAY ALSO LIKE
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => {
          const price    = p.sale_price || p.base_price;
          const imageUrl = p.primary_image
            ? `http://localhost:8000/media/${p.primary_image.replace(/\\/g, "/")}`
            : null;

          return (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="group cursor-pointer"
            >
              {/* Image */}
              <div className="relative mb-3 overflow-hidden rounded-2xl aspect-[3/4]"
                style={{ backgroundColor: "#EDE3D9" }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs"
                    style={{ color: "#7A6E67" }}>
                    No image
                  </div>
                )}

                {p.sale_price && (
                  <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#D97757" }}>
                    SALE
                  </span>
                )}
              </div>

              {/* Info */}
              {p.brand && (
                <p className="text-[10px] font-bold tracking-widest mb-0.5"
                  style={{ color: "#C2A98A" }}>
                  {p.brand.toUpperCase()}
                </p>
              )}

              <p className="text-sm font-medium leading-snug mb-1 line-clamp-2"
                style={{ color: "#2B2B2B" }}>
                {p.title}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                  {formatCurrency(price)}
                </span>
                {p.sale_price && (
                  <span className="text-xs line-through" style={{ color: "#7A6E67" }}>
                    {formatCurrency(p.base_price)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}