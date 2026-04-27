/**
 * AddToCartButton — used in ProductDetailPage
 *
 * Props:
 *   product         → full product object from API
 *   selectedVariant → currently selected variant (or null)
 *   quantity        → qty from the QTY stepper
 *
 * Wires the "ADD TO BAG" button to the real cart API.
 * Replaces the toast-only stub in ProductDetailPage.
 *
 */
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useAddToCart } from "@hooks/useCart";
import { useAuthStore } from "@store";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@constants";

export default function AddToCartButton({ product, selectedVariant, quantity = 1 }) {
  const addToCart      = useAddToCart();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate        = useNavigate();

  const { variants = [], is_in_stock } = product;
  const hasVariants = variants.length > 0;

  // ── Determine button state ─────────────────────────────────
  const outOfStock   = !is_in_stock;
  const needsVariant = hasVariants && !selectedVariant;
  const variantOos   = selectedVariant && selectedVariant.stock === 0;

  const isDisabled   = outOfStock || variantOos || addToCart.isPending;

  const getLabel = () => {
    if (addToCart.isPending) return "ADDING…";
    if (outOfStock || variantOos) return "OUT OF STOCK";
    if (needsVariant) return "SELECT SIZE & COLOR";
    return "ADD TO BAG";
  };

  const getBgColor = () => {
    if (isDisabled) return "#9ca3af";
    if (needsVariant) return "#C2A98A";
    return "#2B2B2B";
  };

  // ── Handle click ───────────────────────────────────────────
  const handleClick = () => {
    // Not logged in → send to login
    if (!isAuthenticated) {
      toast("Sign in to add items to your bag.", { icon: "🛍️" });
      navigate(ROUTES.LOGIN);
      return;
    }

    // Has variants but none selected → hint user
    if (needsVariant) {
      toast("Please select your size and color first.", { icon: "👆" });
      document.getElementById("variant-selector")?.scrollIntoView({
        behavior: "smooth", block: "center",
      });
      return;
    }

    // Add to cart via API
    const variantId = selectedVariant?.id;
    if (!variantId) return;

    addToCart.mutate({ variantId, quantity });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled && !needsVariant} // needsVariant stays clickable (shows hint)
      className="flex flex-1 items-center justify-center gap-2.5 rounded-xl py-4 text-xs font-bold tracking-[0.12em] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed"
      style={{ backgroundColor: getBgColor() }}
    >
      <ShoppingBag size={16} />
      {getLabel()}
    </button>
  );
}