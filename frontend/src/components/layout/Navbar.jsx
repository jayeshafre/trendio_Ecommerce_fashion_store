/**
 * Navbar — Trendio
 * Matches design: Ivory Luxe theme, Playfair Display logo, spaced nav items,
 * search bar, profile/wishlist/bag icons.
 */
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Heart, User, Search, X, LogOut } from "lucide-react";
import { useAuthStore, useCartStore } from "@store";
import { useLogout } from "@hooks/useAuth";
import { ROUTES } from "@constants";

const NAV_CATEGORIES = [
  { label: "SHIRTS",   href: "/shop?category=shirts" },
  { label: "JEANS",    href: "/shop?category=jeans" },
  { label: "T-SHIRTS", href: "/shop?category=t-shirts" },
  { label: "TROUSERS", href: "/shop?category=trousers" },
];

export default function Navbar() {
  const navigate            = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef           = useRef(null);
  const isAuthenticated     = useAuthStore((s) => s.isAuthenticated);
  const totalItems          = useCartStore((s) => s.totalItems);
  const logoutMutation      = useLogout();

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: "#F8F5F2", borderColor: "#E5DCD3" }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link
          to={ROUTES.HOME}
          className="mr-6 shrink-0 font-display text-3xl italic"
          style={{ color: "#2B2B2B", fontFamily: "'Playfair Display', serif" }}
        >
          Trendio
        </Link>

        {/* ── Category Navigation ───────────────────────────────── */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={cat.href}
              className="text-xs font-semibold tracking-[0.12em] transition-colors duration-150 hover:opacity-60"
              style={{ color: "#2B2B2B" }}
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* ── Spacer ───────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Search Bar ───────────────────────────────────────── */}
        <div className="relative hidden md:block">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                style={{ backgroundColor: "#EDE3D9", color: "#2B2B2B" }}
              >
                <Search size={14} style={{ color: "#C2A98A" }} />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-44 bg-transparent outline-none placeholder:text-gray-400"
                  style={{ fontSize: "0.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                >
                  <X size={14} style={{ color: "#2B2B2B" }} />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors duration-150"
              style={{ backgroundColor: "#EDE3D9", color: "#6B6B6B" }}
            >
              <Search size={14} style={{ color: "#C2A98A" }} />
              <span style={{ fontSize: "0.8rem" }}>Search products...</span>
            </button>
          )}
        </div>

        {/* ── Right Icons ───────────────────────────────────────── */}
        <div
          className="flex items-center divide-x"
          style={{ divideColor: "#E5DCD3" }}
        >
          {/* Profile */}
          <Link
            to={isAuthenticated ? ROUTES.ACCOUNT : ROUTES.LOGIN}
            className="flex flex-col items-center gap-0.5 px-4 py-1 transition-opacity hover:opacity-60"
          >
            <User size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span
              className="text-[9px] font-semibold tracking-widest"
              style={{ color: "#2B2B2B" }}
            >
              PROFILE
            </span>
          </Link>

          {/* Wishlist */}
          <Link
            to={isAuthenticated ? ROUTES.WISHLIST : ROUTES.LOGIN}
            className="flex flex-col items-center gap-0.5 px-4 py-1 transition-opacity hover:opacity-60"
          >
            <Heart size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span
              className="text-[9px] font-semibold tracking-widest"
              style={{ color: "#2B2B2B" }}
            >
              WISHLIST
            </span>
          </Link>

          {/* Bag */}
          <Link
            to={ROUTES.CART}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1 transition-opacity hover:opacity-60"
          >
            <div className="relative">
              <ShoppingBag size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span
                  className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: "#C2A98A" }}
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </div>
            <span
              className="text-[9px] font-semibold tracking-widest"
              style={{ color: "#2B2B2B" }}
            >
              BAG
            </span>
          </Link>

          {/* ── TEMPORARY Logout Button — remove when Profile dropdown is built ── */}
          {isAuthenticated && (
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex flex-col items-center gap-0.5 px-4 py-1 transition-opacity hover:opacity-60 disabled:opacity-40"
              style={{ borderLeft: "1px solid #E5DCD3" }}
              title="Sign out"
            >
              <LogOut
                size={18}
                strokeWidth={1.5}
                style={{ color: logoutMutation.isPending ? "#C2A98A" : "#D97757" }}
              />
              <span
                className="text-[9px] font-semibold tracking-widest"
                style={{ color: "#D97757" }}
              >
                {logoutMutation.isPending ? "…" : "LOGOUT"}
              </span>
            </button>
          )}
          {/* ── END TEMPORARY ─────────────────────────────────────────────────── */}
        </div>
      </div>
    </header>
  );
}