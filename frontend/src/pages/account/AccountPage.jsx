/**
 * AccountPage.jsx
 * Route: /account
 *
 * The account hub — shows user greeting, quick stats,
 * and navigation cards to all account sections.
 */
import { Link } from "react-router-dom";
import {
  Package, User, MapPin, Heart,
  ChevronRight, ShieldCheck, LogOut,
} from "lucide-react";
import { useMe } from "@hooks/useProfile";
import { useOrders } from "@hooks/useOrders";
import { useLogout } from "@hooks/useAuth";
import { ROUTES } from "@constants";

const ACCOUNT_SECTIONS = [
  {
    to:          ROUTES.ORDERS,
    icon:        Package,
    label:       "My Orders",
    description: "Track, view, and manage your orders",
    accent:      "#C2A98A",
    bg:          "#FAF7F4",
  },
  {
    to:          ROUTES.PROFILE,
    icon:        User,
    label:       "Profile & Security",
    description: "Edit your name, phone, and password",
    accent:      "#7A6E67",
    bg:          "#F5F3F1",
  },
  {
    to:          ROUTES.ADDRESSES,
    icon:        MapPin,
    label:       "Saved Addresses",
    description: "Manage your delivery addresses",
    accent:      "#C2A98A",
    bg:          "#FAF7F4",
  },
  {
    to:          ROUTES.WISHLIST,
    icon:        Heart,
    label:       "Wishlist",
    description: "Products you've saved for later",
    accent:      "#D97757",
    bg:          "#FDF5F2",
  },
];

export default function AccountPage() {
  const { data: user, isLoading } = useMe();
  const { data: ordersData }      = useOrders({ page_size: 3 });
  const logoutMutation            = useLogout();

  const recentOrders = ordersData?.results ?? [];
  const totalOrders  = ordersData?.count   ?? 0;

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10 animate-fade-in">

      {/* ── Greeting header ─────────────────────────────── */}
      <div
        className="mb-8 overflow-hidden rounded-2xl p-8"
        style={{ backgroundColor: "#EDE3D9" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em]" style={{ color: "#C2A98A" }}>
              WELCOME BACK
            </p>
            {isLoading ? (
              <div className="skeleton mt-2 h-9 w-48 rounded" />
            ) : (
              <h1 className="mt-1 font-display text-3xl" style={{ color: "#2B2B2B" }}>
                {user?.full_name || user?.first_name || "—"}
              </h1>
            )}
            <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>
              {isLoading ? "" : user?.email}
            </p>
          </div>

          {/* Avatar circle */}
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#C2A98A" }}
          >
            <span className="font-display text-2xl text-white">
              {user?.first_name?.[0]?.toUpperCase() ?? "T"}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Orders",   value: totalOrders },
            { label: "Member Since",   value: user ? new Date(user.date_joined).getFullYear() : "—" },
            { label: "Account Status", value: user?.is_verified ? "Verified" : "Unverified" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.5)" }}
            >
              <p className="font-display text-2xl font-semibold" style={{ color: "#2B2B2B" }}>
                {isLoading ? "—" : value}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
                {label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation cards ────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {ACCOUNT_SECTIONS.map(({ to, icon: Icon, label, description, accent, bg }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-4 rounded-xl border p-5 transition-all duration-200 hover:shadow-ivory-md"
            style={{ borderColor: "#E5DCD3", backgroundColor: "white" }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ backgroundColor: bg }}
            >
              <Icon size={20} style={{ color: accent }} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>{label}</p>
              <p className="text-xs" style={{ color: "#7A6E67" }}>{description}</p>
            </div>
            <ChevronRight
              size={16}
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: "#C2A98A" }}
            />
          </Link>
        ))}
      </div>

      {/* ── Recent orders preview ────────────────────────── */}
      {recentOrders.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl" style={{ color: "#2B2B2B" }}>Recent Orders</h2>
            <Link
              to={ROUTES.ORDERS}
              className="text-xs font-semibold tracking-widest transition-opacity hover:opacity-60"
              style={{ color: "#C2A98A" }}
            >
              VIEW ALL →
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                className="card-ivory flex items-center justify-between gap-4 px-5 py-4 transition-shadow hover:shadow-ivory"
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    {order.order_number}
                  </p>
                  <p className="text-xs" style={{ color: "#7A6E67" }}>
                    {order.item_count} item{order.item_count !== 1 ? "s" : ""} ·{" "}
                    {new Date(order.placed_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status={order.status} />
                  <p className="font-display text-base" style={{ color: "#2B2B2B" }}>
                    ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
                  </p>
                  <ChevronRight size={14} style={{ color: "#C2A98A" }} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Sign out ─────────────────────────────────────── */}
      <div className="mt-10 border-t pt-6" style={{ borderColor: "#E5DCD3" }}>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex items-center gap-2 text-xs font-semibold tracking-widest transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ color: "#D97757" }}
        >
          <LogOut size={14} />
          {logoutMutation.isPending ? "SIGNING OUT…" : "SIGN OUT"}
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    pending:   "#D97757",
    confirmed: "#2563eb",
    shipped:   "#7C3AED",
    delivered: "#16a34a",
    cancelled: "#9CA3AF",
  };
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: colors[status] ?? "#C2A98A" }}
    />
  );
}