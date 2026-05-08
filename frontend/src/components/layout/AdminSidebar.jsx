/**
 * AdminSidebar.jsx — persistent admin navigation
 * Matches Trendio ivory brand system exactly.
 */
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart,
  Package, Users, LogOut, MessageSquare,
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

export default function AdminSidebar() {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/auth/login");
  };

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col border-r"
      style={{ backgroundColor: "white", borderColor: "#E5DCD3" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 border-b px-5 py-5"
        style={{ borderColor: "#E5DCD3" }}
      >
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

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
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
  );
}