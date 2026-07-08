import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingBag, Heart, User, Search, X, Menu,
  LogOut, Loader2, Bell, Trash2, CheckCheck,
  Package, CreditCard, ShoppingCart,
} from "lucide-react";
import toast            from "react-hot-toast";
import { useAuthStore } from "@store";
import useCartStore     from "@store/cartStore";
import { useLogout }    from "@hooks/useAuth";
import { useCart }      from "@hooks/useCart";
import {
  useUnreadCount,
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
  useClearAll,
} from "@hooks/useNotifications";
import { ROUTES }        from "@constants";
import { aiApi }         from "@api";
import { formatCurrency } from "@utils";

const NAV_CATEGORIES = [
  { label: "SHIRTS",   slug: "shirts"   },
  { label: "JEANS",    slug: "jeans"    },
  { label: "T-SHIRTS", slug: "t-shirts" },
  { label: "TROUSERS", slug: "trousers" },
];

// ── Notification icon by type ─────────────────────────────────
function NotifIcon({ type }) {
  const map = {
    order_placed:    { icon: ShoppingCart, color: "#C2A98A", bg: "#EDE3D9" },
    order_confirmed: { icon: Package,      color: "#16a34a", bg: "#F0FDF4" },
    order_shipped:   { icon: Package,      color: "#2563eb", bg: "#EFF6FF" },
    order_delivered: { icon: Package,      color: "#16a34a", bg: "#F0FDF4" },
    order_cancelled: { icon: X,            color: "#D97757", bg: "#FDF3F0" },
    payment_success: { icon: CreditCard,   color: "#16a34a", bg: "#F0FDF4" },
    payment_failed:  { icon: CreditCard,   color: "#D97757", bg: "#FDF3F0" },
  };
  const cfg  = map[type] || { icon: Bell, color: "#C2A98A", bg: "#EDE3D9" };
  const Icon = cfg.icon;
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: cfg.bg }}
    >
      <Icon size={14} style={{ color: cfg.color }} />
    </div>
  );
}

// ── Notification Dropdown ─────────────────────────────────────
// NOTE: width was a fixed `w-80` (320px) anchored `right-0`, which clips
// off-screen on phones narrower than ~350px. Fixed with a responsive cap.
function NotificationDropdown({ onClose }) {
  const { data, isLoading }  = useNotifications({ page_size: 8 });
  const markRead             = useMarkRead();
  const markAllRead          = useMarkAllRead();
  const deleteNotif          = useDeleteNotification();
  const clearAll             = useClearAll();

  const notifications = data?.results ?? [];
  const hasUnread     = notifications.some((n) => !n.is_read);

  const handleClick = (notif) => {
    if (!notif.is_read) markRead.mutate(notif.id);
  };

  return (
    <div
      className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl shadow-xl"
      style={{ backgroundColor: "white", border: "1px solid #E5DCD3" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
      >
        <p className="text-xs font-bold tracking-widest" style={{ color: "#2B2B2B" }}>
          NOTIFICATIONS
        </p>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors hover:bg-[#EDE3D9]"
              style={{ color: "#C2A98A" }}
              title="Mark all as read"
            >
              <CheckCheck size={11} /> All read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => clearAll.mutate()}
              disabled={clearAll.isPending}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors hover:bg-[#FDF3F0]"
              style={{ color: "#D97757" }}
              title="Clear all"
            >
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <Bell size={28} className="mb-2" style={{ color: "#C2A98A" }} strokeWidth={1.5} />
            <p className="text-sm font-medium" style={{ color: "#2B2B2B" }}>
              No notifications yet
            </p>
            <p className="mt-1 text-xs" style={{ color: "#7A6E67" }}>
              Order updates will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#F0EAE4" }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="group relative flex gap-3 px-4 py-3 transition-colors hover:bg-[#FAF7F4]"
                style={{
                  backgroundColor: notif.is_read ? "transparent" : "#FDF8F4",
                  cursor: notif.order_id ? "pointer" : "default",
                }}
                onClick={() => handleClick(notif)}
              >
                {/* Unread dot */}
                {!notif.is_read && (
                  <div
                    className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: "#C2A98A" }}
                  />
                )}

                <NotifIcon type={notif.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight" style={{ color: "#2B2B2B" }}>
                    {notif.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: "#7A6E67" }}>
                    {notif.message}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: "#C0B8B4" }}>
                    {new Date(notif.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif.mutate(notif.id);
                  }}
                  className="shrink-0 self-start opacity-0 transition-opacity group-hover:opacity-100 mt-0.5 rounded p-0.5 hover:bg-[#FDF3F0]"
                >
                  <X size={11} style={{ color: "#D97757" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t px-4 py-2.5" style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}>
          <Link
            to={ROUTES.ACCOUNT}
            onClick={onClose}
            className="block text-center text-[10px] font-bold tracking-widest transition-colors hover:text-[#C2A98A]"
            style={{ color: "#7A6E67" }}
          >
            VIEW ACCOUNT →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [aiResults,      setAiResults]      = useState([]);
  const [aiLoading,      setAiLoading]      = useState(false);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [bellOpen,       setBellOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef       = useRef(null); // desktop (lg+) input
  const mobileSearchRef  = useRef(null); // mobile/tablet panel input
  const dropdownRef     = useRef(null);
  const bellRef          = useRef(null);
  const debounceRef     = useRef(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalItems      = useCartStore((s) => s.totalItems);
  const logoutMutation  = useLogout();

  // Unread count — only fetch when logged in
  const { data: unreadCount = 0 } = useUnreadCount(isAuthenticated);

  useCart();

  const activeCategory = searchParams.get("category") || "";

  // Focus whichever search input is actually visible (desktop vs mobile panel)
  useEffect(() => {
    if (!searchOpen) return;
    const el = searchRef.current?.offsetParent ? searchRef.current : mobileSearchRef.current;
    el?.focus();
  }, [searchOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced AI search
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setAiResults([]);
      setDropdownOpen(false);
      return;
    }

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

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      closeSearch();
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setDropdownOpen(false);
    setAiResults([]);
  };

  const handleResultClick = () => {
    closeSearch();
  };

  const goIfAuth = (destination, label) => {
    if (!isAuthenticated) {
      toast(`Sign in to access ${label}.`, { icon: "👤" });
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(destination);
  };

  // Shared AI-results list, rendered inside both the desktop dropdown
  // and the mobile/tablet search panel so the markup isn't duplicated.
  const renderAiResults = () => (
    <>
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
            <div
              className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg"
              style={{ backgroundColor: "#EDE3D9" }}
            >
              {imageUrl && (
                <img src={imageUrl} alt={product.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-1" style={{ color: "#2B2B2B" }}>
                {product.title}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#7A6E67" }}>
                {product.category_name}
              </p>
            </div>
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

      <button
        type="submit"
        className="w-full py-3 text-xs font-bold tracking-widest transition-colors hover:bg-[#EDE3D9]"
        style={{ color: "#C2A98A" }}
      >
        SEE ALL RESULTS FOR "{searchQuery.toUpperCase()}" →
      </button>
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: "#F8F5F2", borderColor: "#E5DCD3" }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:gap-6">

        {/* Hamburger — phones & tablets only (<1024px) */}
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen((o) => !o);
            setSearchOpen(false);
          }}
          className="shrink-0 rounded-lg p-1.5 lg:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen
            ? <X size={22} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            : <Menu size={22} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
          }
        </button>

        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          className="mr-1 shrink-0 font-display text-2xl italic sm:text-3xl lg:mr-4"
          style={{ color: "#2B2B2B", fontFamily: "'Playfair Display', serif" }}
        >
          Trendio
        </Link>

        {/* Category nav — desktop only (1024px+) */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="text-xs font-semibold tracking-[0.12em] transition-all duration-150"
                style={{
                  color:         isActive ? "#C2A98A" : "#2B2B2B",
                  borderBottom:  isActive ? "1.5px solid #C2A98A" : "1.5px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* AI Search — desktop only (1024px+) */}
        <div className="relative hidden lg:block" ref={dropdownRef}>
          {searchOpen ? (
            <form onSubmit={handleSearch}>
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ backgroundColor: "#EDE3D9" }}
              >
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
                <button type="button" onClick={closeSearch}>
                  <X size={14} style={{ color: "#2B2B2B" }} />
                </button>
              </div>

              {/* AI Results Dropdown */}
              {dropdownOpen && aiResults.length > 0 && (
                <div
                  className="absolute left-0 top-12 z-50 w-[min(24rem,90vw)] overflow-hidden rounded-2xl shadow-xl"
                  style={{ backgroundColor: "#fff", border: "1px solid #E5DCD3" }}
                >
                  <div
                    className="border-b px-4 py-2.5"
                    style={{ borderColor: "#E5DCD3", backgroundColor: "#F8F5F2" }}
                  >
                    <p className="text-[10px] font-bold tracking-widest" style={{ color: "#C2A98A" }}>
                      AI SUGGESTIONS
                    </p>
                  </div>
                  {renderAiResults()}
                </div>
              )}
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ backgroundColor: "#EDE3D9", color: "#6B6B6B" }}
            >
              <Search size={14} style={{ color: "#C2A98A" }} />
              <span style={{ fontSize: "0.8rem" }}>Search products...</span>
            </button>
          )}
        </div>

        {/* ── Right icons ──────────────────────────────────── */}
        <div className="flex items-center">

          {/* Search icon — phones & tablets only (<1024px) */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen((o) => !o);
              setMobileMenuOpen(false);
            }}
            className="flex flex-col items-center gap-0.5 px-2 py-1 lg:hidden"
            aria-label="Search"
          >
            <Search size={18} style={{ color: searchOpen ? "#C2A98A" : "#2B2B2B" }} strokeWidth={1.5} />
          </button>

          {/* Profile — icon always visible; label appears at lg+ */}
          <button
            type="button"
            onClick={() => goIfAuth(ROUTES.ACCOUNT, "your profile")}
            className="flex flex-col items-center gap-0.5 border-l px-2 py-1 transition-opacity hover:opacity-60 lg:px-4"
            style={{ borderColor: "#E5DCD3" }}
          >
            <User size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span className="hidden text-[9px] font-semibold tracking-widest lg:inline" style={{ color: "#2B2B2B" }}>PROFILE</span>
          </button>

          {/* Wishlist — icon always visible; label appears at lg+ */}
          <button
            type="button"
            onClick={() => goIfAuth(ROUTES.WISHLIST, "your wishlist")}
            className="flex flex-col items-center gap-0.5 border-l px-2 py-1 transition-opacity hover:opacity-60 lg:px-4"
            style={{ borderColor: "#E5DCD3" }}
          >
            <Heart size={18} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
            <span className="hidden text-[9px] font-semibold tracking-widest lg:inline" style={{ color: "#2B2B2B" }}>WISHLIST</span>
          </button>

          {/* ── Notification Bell — all sizes ── */}
          {isAuthenticated && (
            <div className="relative border-l" style={{ borderColor: "#E5DCD3" }} ref={bellRef}>
              <button
                type="button"
                onClick={() => setBellOpen((o) => !o)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 lg:px-4"
              >
                <div className="relative">
                  <Bell
                    size={18}
                    strokeWidth={1.5}
                    style={{ color: bellOpen ? "#C2A98A" : "#2B2B2B" }}
                  />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: "#D97757" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className="hidden text-[9px] font-semibold tracking-widest lg:inline"
                  style={{ color: bellOpen ? "#C2A98A" : "#2B2B2B" }}
                >
                  ALERTS
                </span>
              </button>

              {bellOpen && (
                <NotificationDropdown onClose={() => setBellOpen(false)} />
              )}
            </div>
          )}

          {/* Bag — all sizes */}
          <Link
            to={ROUTES.CART}
            className="relative flex flex-col items-center gap-0.5 border-l px-2 py-1 transition-opacity hover:opacity-60 lg:px-4"
            style={{ borderColor: "#E5DCD3" }}
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
            <span className="hidden text-[9px] font-semibold tracking-widest lg:inline" style={{ color: "#2B2B2B" }}>BAG</span>
          </Link>

        </div>
      </div>

      {/* ── Mobile/tablet search panel (<1024px) ───────────── */}
      {searchOpen && (
        <div
          className="border-t px-4 py-3 lg:hidden"
          style={{ borderColor: "#E5DCD3" }}
        >
          <form onSubmit={handleSearch}>
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2.5"
              style={{ backgroundColor: "#EDE3D9" }}
            >
              {aiLoading
                ? <Loader2 size={14} className="animate-spin" style={{ color: "#C2A98A" }} />
                : <Search size={14} style={{ color: "#C2A98A" }} />
              }
              <input
                ref={mobileSearchRef}
                value={searchQuery}
                onChange={handleQueryChange}
                placeholder="Search products..."
                className="w-full bg-transparent outline-none placeholder:text-gray-400"
                style={{ fontSize: "0.85rem", color: "#2B2B2B" }}
              />
              <button type="button" onClick={closeSearch}>
                <X size={16} style={{ color: "#2B2B2B" }} />
              </button>
            </div>

            {dropdownOpen && aiResults.length > 0 && (
              <div
                className="mt-2 max-h-[70vh] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: "#fff", border: "1px solid #E5DCD3" }}
              >
                <div
                  className="border-b px-4 py-2.5"
                  style={{ borderColor: "#E5DCD3", backgroundColor: "#F8F5F2" }}
                >
                  <p className="text-[10px] font-bold tracking-widest" style={{ color: "#C2A98A" }}>
                    AI SUGGESTIONS
                  </p>
                </div>
                {renderAiResults()}
              </div>
            )}
          </form>
        </div>
      )}

      {/* ── Mobile/tablet menu drawer (<1024px) ─────────────── */}
      {mobileMenuOpen && (
        <div
          className="border-t px-4 py-4 lg:hidden"
          style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
        >
          <nav className="flex flex-col gap-3.5">
            {NAV_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  to={`/shop?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold tracking-[0.08em]"
                  style={{ color: isActive ? "#C2A98A" : "#2B2B2B" }}
                >
                  {cat.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}