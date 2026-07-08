/**
 * AdminUsers.jsx
 * Route: /admin/users
 *
 * Features:
 *   - Paginated user list
 *   - Search by email / name / phone
 *   - Filter by is_active, role
 *   - Soft delete (toggle is_active)
 *   - User detail drawer (order summary)
 */
import { useState } from "react";
import {
  Search, Users, ShieldCheck,
  CheckCircle2, XCircle, ChevronRight,
  X, ShoppingBag, TrendingUp,
} from "lucide-react";
import { useAdminUsers, useAdminUserDetail, useToggleUser } from "@hooks/useAdmin";

// ── Active badge ──────────────────────────────────────────────
function ActiveBadge({ isActive }) {
  return isActive ? (
    <span
      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
      style={{ backgroundColor: "#F0FDF4", color: "#16a34a" }}
    >
      <CheckCircle2 size={9} /> ACTIVE
    </span>
  ) : (
    <span
      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
      style={{ backgroundColor: "#FDF3F0", color: "#D97757" }}
    >
      <XCircle size={9} /> INACTIVE
    </span>
  );
}

// ── User Detail Drawer ────────────────────────────────────────
function UserDrawer({ userId, onClose }) {
  const toggleUser  = useToggleUser();
  const { data: user, isLoading } = useAdminUserDetail(userId);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto shadow-xl animate-slide-in-right"
        style={{ backgroundColor: "white" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: "#E5DCD3" }}
        >
          <h2 className="font-display text-xl" style={{ color: "#2B2B2B" }}>
            User Detail
          </h2>
          <button onClick={onClose}>
            <X size={18} style={{ color: "#7A6E67" }} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : !user ? (
          <p className="p-6 text-sm" style={{ color: "#D97757" }}>Failed to load user.</p>
        ) : (
          <div className="flex-1 space-y-6 p-6">

            {/* Identity */}
            <div className="card-ivory p-5">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                  style={{ backgroundColor: "#EDE3D9", color: "#C2A98A" }}
                >
                  {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                </div>
                <ActiveBadge isActive={user.is_active} />
              </div>
              <p className="font-semibold" style={{ color: "#2B2B2B" }}>
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm" style={{ color: "#7A6E67" }}>{user.email}</p>
              <p className="text-sm" style={{ color: "#7A6E67" }}>{user.phone}</p>
            </div>

            {/* Metadata */}
            <div className="card-ivory divide-y" style={{ borderColor: "#E5DCD3" }}>
              {[
                ["Role",        user.role],
                ["Verified",    user.is_verified ? "Yes" : "No"],
                ["Joined",      new Date(user.date_joined).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
                ["Last Login",  user.last_login ? new Date(user.last_login).toLocaleDateString("en-IN") : "Never"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-5 py-3 text-sm">
                  <span style={{ color: "#7A6E67" }}>{label}</span>
                  <span className="font-medium capitalize" style={{ color: "#2B2B2B" }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-ivory p-4 text-center">
                <ShoppingBag size={18} className="mx-auto mb-2" style={{ color: "#C2A98A" }} />
                <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>
                  {user.order_summary?.total_orders ?? 0}
                </p>
                <p className="text-xs" style={{ color: "#7A6E67" }}>Total Orders</p>
              </div>
              <div className="card-ivory p-4 text-center">
                <TrendingUp size={18} className="mx-auto mb-2" style={{ color: "#16a34a" }} />
                <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>
                  ₹{parseFloat(user.order_summary?.total_spent ?? 0).toLocaleString("en-IN")}
                </p>
                <p className="text-xs" style={{ color: "#7A6E67" }}>Total Spent</p>
              </div>
            </div>

            {/* Toggle active */}
            {user.role !== "admin" && (
              <button
                onClick={() => toggleUser.mutate(user.id)}
                disabled={toggleUser.isPending}
                className="w-full rounded-xl border py-3 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  borderColor:     user.is_active ? "#D97757" : "#16a34a",
                  color:           user.is_active ? "#D97757" : "#16a34a",
                  backgroundColor: user.is_active ? "#FDF3F0" : "#F0FDF4",
                }}
              >
                {toggleUser.isPending
                  ? "Updating…"
                  : user.is_active
                  ? "Deactivate User"
                  : "Activate User"
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminUsers() {
  const [search,    setSearch]    = useState("");
  const [isActive,  setIsActive]  = useState("");
  const [page,      setPage]      = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  // Debounce search: only send after user pauses typing
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const { data, isLoading, isError } = useAdminUsers({
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(isActive !== ""  && { is_active: isActive }),
    page,
    role: "customer",
  });

  const users   = data?.results ?? [];
  const count   = data?.count   ?? 0;
  const hasNext = !!data?.next;
  const hasPrev = !!data?.previous;

  return (
    <div className="py-6 pr-2">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>
          ADMIN
        </p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>
          User Management
        </h1>
        {!isLoading && (
          <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>
            {count} customer{count !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ borderColor: "#E5DCD3", backgroundColor: "white" }}
        >
          <Search size={13} style={{ color: "#C2A98A" }} />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search email, name, phone…"
            className="w-52 bg-transparent text-xs outline-none"
            style={{ color: "#2B2B2B" }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}>
              <X size={11} style={{ color: "#7A6E67" }} />
            </button>
          )}
        </div>

        {/* Active filter */}
        {[
          { label: "All",      value: "" },
          { label: "Active",   value: "true" },
          { label: "Inactive", value: "false" },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setIsActive(value); setPage(1); }}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              backgroundColor: isActive === value ? "#C2A98A" : "#EDE3D9",
              color:           isActive === value ? "white"   : "#7A6E67",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#FDF3F0" }}>
          <p className="text-sm" style={{ color: "#D97757" }}>Failed to load users.</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <Users size={40} className="mb-3" style={{ color: "#C2A98A" }} />
          <p className="font-display text-xl" style={{ color: "#2B2B2B" }}>No users found</p>
        </div>
      ) : (
        <>
          {/* Mobile/tablet — card list (the grid table below needs
              ~650px of fixed-column width and won't fit next to the
              sidebar until lg) */}
          <div className="space-y-3 lg:hidden">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedId(user.id)}
                className="card-ivory block w-full space-y-2 p-4 text-left transition-colors hover:bg-[#FAF7F4]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                      {user.full_name || "—"}
                    </p>
                    <p className="truncate text-xs" style={{ color: "#7A6E67" }}>
                      {user.email}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0" style={{ color: "#C2A98A" }} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2" style={{ borderColor: "#E5DCD3" }}>
                  <div className="flex items-center gap-1">
                    {user.role === "admin" && (
                      <ShieldCheck size={12} style={{ color: "#C2A98A" }} />
                    )}
                    <span className="text-xs capitalize" style={{ color: "#2B2B2B" }}>
                      {user.role}
                    </span>
                    <span className="text-xs" style={{ color: "#C0B8B4" }}>·</span>
                    <span className="text-[11px]" style={{ color: "#7A6E67" }}>
                      Joined {new Date(user.date_joined).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <ActiveBadge isActive={user.is_active} />
                </div>
              </button>
            ))}
          </div>

          {/* Desktop — full grid table (lg+, where 650px of fixed
              columns actually has room next to the sidebar) */}
          <div className="card-ivory hidden overflow-hidden lg:block">
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_180px_100px_80px_32px] gap-4 border-b px-5 py-3"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
          >
            {["User", "Email", "Role", "Status", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] font-bold tracking-widest"
                style={{ color: "#7A6E67" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: "#E5DCD3" }}>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedId(user.id)}
                className="grid w-full grid-cols-[1fr_180px_100px_80px_32px] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAF7F4]"
              >
                {/* Name + joined */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    {user.full_name || "—"}
                  </p>
                  <p className="text-[11px]" style={{ color: "#7A6E67" }}>
                    Joined {new Date(user.date_joined).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>

                {/* Email */}
                <p className="truncate text-xs" style={{ color: "#7A6E67" }}>
                  {user.email}
                </p>

                {/* Role */}
                <div className="flex items-center gap-1">
                  {user.role === "admin" && (
                    <ShieldCheck size={12} style={{ color: "#C2A98A" }} />
                  )}
                  <span className="text-xs capitalize" style={{ color: "#2B2B2B" }}>
                    {user.role}
                  </span>
                </div>

                {/* Active */}
                <ActiveBadge isActive={user.is_active} />

                {/* Arrow */}
                <ChevronRight size={14} style={{ color: "#C2A98A" }} />
              </button>
            ))}
          </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
            className="btn-outline px-5 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-3 text-sm" style={{ color: "#7A6E67" }}>
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="btn-primary px-5 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Drawer */}
      {selectedId && (
        <UserDrawer
          userId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}