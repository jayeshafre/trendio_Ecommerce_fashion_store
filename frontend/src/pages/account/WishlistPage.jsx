/**
 * WishlistPage — /account/wishlist
 *
 * Stub page — prevents the 404.
 * Full wishlist feature will be built in the Account module.
 * For now shows a clean "coming soon" state consistent with the Ivory Luxe theme.
 */
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { ROUTES } from "@constants";

export default function WishlistPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F5F2" }}>
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">

        {/* Page title */}
        <div className="mb-10">
          <h1
            className="mb-1 text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
          >
            My Wishlist
          </h1>
          <p className="text-sm" style={{ color: "#7A6E67" }}>
            Items you've saved for later.
          </p>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EDE3D9" }}
          >
            <Heart size={36} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          </div>

          <h2
            className="mb-2 text-xl font-semibold"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2B2B2B" }}
          >
            Your wishlist is empty
          </h2>

          <p className="mb-8 max-w-xs text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
            Browse the shop and tap the heart icon on any product to save it here.
          </p>

          <Link
            to={ROUTES.SHOP}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-xs font-bold tracking-[0.15em] text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#2B2B2B" }}
          >
            <ShoppingBag size={14} />
            BROWSE PRODUCTS
          </Link>
        </div>

      </div>
    </div>
  );
}