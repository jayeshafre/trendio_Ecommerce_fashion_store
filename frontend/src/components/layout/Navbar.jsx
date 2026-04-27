/**
 * Navbar — UPDATED with live cart badge from useCart
 */
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, Heart, User, Search, X, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@store";
import useCartStore     from "@store/cartStore";
import { useLogout }    from "@hooks/useAuth";
import { useCart }      from "@hooks/useCart";
import { ROUTES }       from "@constants";

const NAV_CATEGORIES = [
  { label: "SHIRTS",   slug: "shirts"   },
  { label: "JEANS",    slug: "jeans"    },
  { label: "T-SHIRTS", slug: "t-shirts" },
  { label: "TROUSERS", slug: "trousers" },
];

export default function Navbar() {
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef             = useRef(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalItems      = useCartStore((s) => s.totalItems);
  const logoutMutation  = useLogout();

  // Fetch cart silently on mount — keeps badge count fresh
  useCart();

  const activeCategory = searchParams.get("category") || "";

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/shop?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const goIfAuth = (destination, label) => {
    if (!isAuthenticated) {
      toast(`Sign in to access ${label}.`, { icon: "👤" });
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(destination);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ backgroundColor: "#F8F5F2", borderColor: "#E5DCD3" }}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">

        <Link to={ROUTES.HOME} className="mr-4 shrink-0 font-display text-3xl italic" style={{ color: "#2B2B2B", fontFamily: "'Playfair Display', serif" }}>
          Trendio
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <Link key={cat.slug} to={`/shop?category=${cat.slug}`}
                className="text-xs font-semibold tracking-[0.12em] transition-all duration-150"
                style={{ color: isActive ? "#C2A98A" : "#2B2B2B", borderBottom: isActive ? "1.5px solid #C2A98A" : "1.5px solid transparent", paddingBottom: "2px" }}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="relative hidden md:block">
          {searchOpen ? (
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#EDE3D9" }}>
                <Search size={14} style={{ color: "#C2A98A" }} />
                <input ref={searchRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." className="w-44 bg-transparent outline-none placeholder:text-gray-400"
                  style={{ fontSize: "0.8rem", color: "#2B2B2B" }} />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X size={14} style={{ color: "#2B2B2B" }} />
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: "#EDE3D9", color: "#6B6B6B" }}>
              <Search size={14} style={{ color: "#C2A98A" }} />
              <span style={{ fontSize: "0.8rem" }}>Search products...</span>
            </button>
          )}
        </div>

        <div className="flex items-center">
          <button type="button" onClick={() => goIfAuth(ROUTES.ACCOUNT, "your profile")}
            className="flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60" style={{ borderColor: "#E5DCD3" }}>
            <User size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>PROFILE</span>
          </button>

          <button type="button" onClick={() => goIfAuth(ROUTES.WISHLIST, "your wishlist")}
            className="flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60" style={{ borderColor: "#E5DCD3" }}>
            <Heart size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>WISHLIST</span>
          </button>

          {/* BAG with live badge */}
          <Link to={ROUTES.CART} className="relative flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60" style={{ borderColor: "#E5DCD3" }}>
            <div className="relative">
              <ShoppingBag size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: "#C2A98A" }}>
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </div>
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>BAG</span>
          </Link>

          {isAuthenticated && (
            <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}
              className="flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60 disabled:opacity-40" style={{ borderColor: "#E5DCD3" }}>
              <LogOut size={18} strokeWidth={1.5} style={{ color: logoutMutation.isPending ? "#C2A98A" : "#D97757" }} />
              <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#D97757" }}>
                {logoutMutation.isPending ? "…" : "LOGOUT"}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}