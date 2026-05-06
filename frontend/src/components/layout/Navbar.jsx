import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams }        from "react-router-dom";
import { ShoppingBag, Heart, User, Search, X, LogOut, Loader2 } from "lucide-react";
import toast             from "react-hot-toast";
import { useAuthStore }  from "@store";
import useCartStore      from "@store/cartStore";
import { useLogout }     from "@hooks/useAuth";
import { useCart }       from "@hooks/useCart";
import { ROUTES }        from "@constants";
import { aiApi }         from "@api";
import { formatCurrency } from "@utils";

const NAV_CATEGORIES = [
  { label: "SHIRTS",   slug: "shirts"   },
  { label: "JEANS",    slug: "jeans"    },
  { label: "T-SHIRTS", slug: "t-shirts" },
  { label: "TROUSERS", slug: "trousers" },
];

export default function Navbar() {
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [aiResults, setAiResults]       = useState([]);
  const [aiLoading, setAiLoading]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef    = useRef(null);
  const dropdownRef  = useRef(null);
  const debounceRef  = useRef(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalItems      = useCartStore((s) => s.totalItems);
  const logoutMutation  = useLogout();

  useCart();

  const activeCategory = searchParams.get("category") || "";

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced AI search — fires 400ms after user stops typing
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timer
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setAiResults([]);
      setDropdownOpen(false);
      return;
    }

    // Set new timer
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await aiApi.search(value.trim(), 4);
        setAiResults(res.data.results || []);
        setDropdownOpen(true);
      } catch {
        setAiResults([]);
      } finally {
        setAiLoading(false);
      }
    }, 400);
  };

  // Enter key — navigate to ShopPage with Django search (existing behavior)
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery("");
      setDropdownOpen(false);
      setAiResults([]);
    }
  };

  const handleResultClick = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setDropdownOpen(false);
    setAiResults([]);
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
    <header className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: "#F8F5F2", borderColor: "#E5DCD3" }}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-6">

        <Link to={ROUTES.HOME} className="mr-4 shrink-0 font-display text-3xl italic"
          style={{ color: "#2B2B2B", fontFamily: "'Playfair Display', serif" }}>
          Trendio
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <Link key={cat.slug} to={`/shop?category=${cat.slug}`}
                className="text-xs font-semibold tracking-[0.12em] transition-all duration-150"
                style={{
                  color:        isActive ? "#C2A98A" : "#2B2B2B",
                  borderBottom: isActive ? "1.5px solid #C2A98A" : "1.5px solid transparent",
                  paddingBottom: "2px",
                }}>
                {cat.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Search with AI dropdown */}
        <div className="relative hidden md:block" ref={dropdownRef}>
          {searchOpen ? (
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: "#EDE3D9" }}>
                {aiLoading
                  ? <Loader2 size={14} className="animate-spin" style={{ color: "#C2A98A" }} />
                  : <Search size={14} style={{ color: "#C2A98A" }} />
                }
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={handleQueryChange}
                  placeholder="Search products..."
                  className="w-52 bg-transparent outline-none placeholder:text-gray-400"
                  style={{ fontSize: "0.8rem", color: "#2B2B2B" }}
                />
                <button type="button" onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setDropdownOpen(false);
                  setAiResults([]);
                }}>
                  <X size={14} style={{ color: "#2B2B2B" }} />
                </button>
              </div>

              {/* AI Results Dropdown */}
              {dropdownOpen && aiResults.length > 0 && (
                <div
                  className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl shadow-xl"
                  style={{
                    backgroundColor: "#fff",
                    border:          "1px solid #E5DCD3",
                    minWidth:        "320px",
                  }}
                >
                  {/* Header */}
                  <div className="border-b px-4 py-2.5"
                    style={{ borderColor: "#E5DCD3", backgroundColor: "#F8F5F2" }}>
                    <p className="text-[10px] font-bold tracking-widest"
                      style={{ color: "#C2A98A" }}>
                      AI SUGGESTIONS
                    </p>
                  </div>

                  {/* Product results */}
                  {aiResults.map((product) => {
                    const price    = product.sale_price || product.base_price;
                    const imageUrl = product.primary_image
                      ? `http://localhost:8000/media/${product.primary_image.replace(/\\/g, "/")}`
                      : null;

                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.slug}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F8F5F2]"
                        style={{ borderBottom: "1px solid #F0EAE4" }}
                      >
                        {/* Thumbnail */}
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"
                          style={{ backgroundColor: "#EDE3D9" }}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.title}
                              className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full" style={{ backgroundColor: "#EDE3D9" }} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1"
                            style={{ color: "#2B2B2B" }}>
                            {product.title}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#7A6E67" }}>
                            {product.category_name}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                            {formatCurrency(price)}
                          </p>
                          {product.sale_price && (
                            <p className="text-[10px] line-through" style={{ color: "#7A6E67" }}>
                              {formatCurrency(product.base_price)}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}

                  {/* See all results */}
                  <button
                    type="submit"
                    className="w-full py-3 text-xs font-bold tracking-widest transition-colors hover:bg-[#EDE3D9]"
                    style={{ color: "#C2A98A" }}
                  >
                    SEE ALL RESULTS FOR "{searchQuery.toUpperCase()}" →
                  </button>
                </div>
              )}
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: "#EDE3D9", color: "#6B6B6B" }}>
              <Search size={14} style={{ color: "#C2A98A" }} />
              <span style={{ fontSize: "0.8rem" }}>Search products...</span>
            </button>
          )}
        </div>

        <div className="flex items-center">
          <button type="button" onClick={() => goIfAuth(ROUTES.ACCOUNT, "your profile")}
            className="flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60"
            style={{ borderColor: "#E5DCD3" }}>
            <User size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>PROFILE</span>
          </button>

          <button type="button" onClick={() => goIfAuth(ROUTES.WISHLIST, "your wishlist")}
            className="flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60"
            style={{ borderColor: "#E5DCD3" }}>
            <Heart size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>WISHLIST</span>
          </button>

          <Link to={ROUTES.CART}
            className="relative flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60"
            style={{ borderColor: "#E5DCD3" }}>
            <div className="relative">
              <ShoppingBag size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: "#C2A98A" }}>
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </div>
            <span className="text-[9px] font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>BAG</span>
          </Link>

          {isAuthenticated && (
            <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}
              className="flex flex-col items-center gap-0.5 border-l px-4 py-1 transition-opacity hover:opacity-60 disabled:opacity-40"
              style={{ borderColor: "#E5DCD3" }}>
              <LogOut size={18} strokeWidth={1.5}
                style={{ color: logoutMutation.isPending ? "#C2A98A" : "#D97757" }} />
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