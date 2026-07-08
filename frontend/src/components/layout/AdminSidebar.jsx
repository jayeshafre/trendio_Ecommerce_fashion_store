/**
 * AdminSidebar.jsx — persistent admin navigation
 * Matches Trendio ivory brand system exactly.
 *
 * RESPONSIVE UPDATE:
 * Below md (768px) this becomes an off-canvas drawer controlled by
 * AdminLayout — it slides in/out via `isOpen` instead of always
 * occupying a fixed 240px of screen width. At md+ it behaves exactly
 * as before (static, always visible).
 */
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart,
  Package, Users, LogOut, MessageSquare, X,
} from "lucide-react";
import useAuthStore from "@store/authStore";
import toast from "react-hot-toast";

const NAV = [
  { to: "/admin",          label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders",   label: "Orders",    icon: ShoppingCart },
  { to: "/admin/products", label: "Products",  icon: Package },
  { to: "/admin/users",    label: "Users",     icon: Users },
  { to: "/admin/reviews",  label: "Reviews",   icon: MessageSquare },
];

export default function AdminSidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/auth/login");
  };

  return (
    <>
      {/* Mobile/tablet backdrop — dismisses the drawer on tap */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(43,43,43,0.4)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "white", borderColor: "#E5DCD3" }}
      >
        {/* Brand */}
        <div
          className="flex items-center justify-between gap-2.5 border-b px-5 py-5"
          style={{ borderColor: "#E5DCD3" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="font-display text-2xl italic tracking-tight"
              style={{ color: "#2B2B2B" }}
            >
              Trendio
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest"
              style={{ backgroundColor: "#EDE3D9", color: "#C2A98A" }}
            >
              ADMIN
            </span>
          </div>

          {/* Close button — mobile/tablet only */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden"
            aria-label="Close menu"
          >
            <X size={18} style={{ color: "#7A6E67" }} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => onClose?.()}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150"
              style={({ isActive }) => ({
                backgroundColor: isActive ? "#C2A98A"    : "transparent",
                color:           isActive ? "white"      : "#7A6E67",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.backgroundColor = "#F8F5F2";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.getAttribute("aria-current")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t p-3" style={{ borderColor: "#E5DCD3" }}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:bg-[#FDF3F0]"
            style={{ color: "#D97757" }}
          >
            <LogOut size={16} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}