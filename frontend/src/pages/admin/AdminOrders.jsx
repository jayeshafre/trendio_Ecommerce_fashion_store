/**
 * AdminOrders.jsx
 * Route: /admin/orders
 * Admin: view all orders, filter by status, update status with transition validation.
 *
 * Allowed transitions mirror backend ALLOWED_TRANSITIONS exactly:
 *   pending   → confirmed | cancelled
 *   confirmed → shipped   | cancelled
 *   shipped   → delivered
 *   delivered → (none)
 *   cancelled → (none)
 */
import { useState } from "react";
import { Package, ChevronDown, Search } from "lucide-react";
import { useAdminOrders, useAdminUpdateStatus } from "@hooks/useOrders";
import OrderStatusBadge from "../account/components/OrderStatusBadge";

// Mirror backend ALLOWED_TRANSITIONS
const TRANSITIONS = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["shipped",   "cancelled"],
  shipped:   ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_FILTERS = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped",   value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrders() {
  const [statusFilter, setStatusFilter]     = useState("");
  const [page, setPage]                     = useState(1);
  const [searchQuery, setSearchQuery]       = useState("");
  const [updatingId, setUpdatingId]         = useState(null);

  const { data, isLoading, isError }  = useAdminOrders({
    ...(statusFilter && { status: statusFilter }),
    page,
  });
  const updateStatus = useAdminUpdateStatus();

  const orders  = data?.results ?? [];
  const count   = data?.count   ?? 0;
  const hasNext = !!data?.next;
  const hasPrev = !!data?.previous;

  // Client-side search by order number
  const filtered = searchQuery.trim()
    ? orders.filter((o) =>
        o.order_number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  const handleStatusChange = (orderId, newStatus) => {
    setUpdatingId(orderId);
    updateStatus.mutate({ id: orderId, status: newStatus }, {
      onSettled: () => setUpdatingId(null),
    });
  };

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>ADMIN</p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>Order Management</h1>
        {!isLoading && (
          <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>{count} total orders</p>
        )}
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ borderColor: "#E5DCD3", backgroundColor: "#EDE3D9" }}
        >
          <Search size={13} style={{ color: "#C2A98A" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order number…"
            className="bg-transparent outline-none text-xs w-44"
            style={{ color: "#2B2B2B" }}
          />
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ label, value }) => {
            const isActive = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? "#C2A98A" : "#EDE3D9",
                  color:           isActive ? "white"   : "#7A6E67",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#FDF3F0" }}>
          <p className="text-sm" style={{ color: "#D97757" }}>Failed to load orders.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Package size={40} className="mx-auto mb-3" style={{ color: "#C2A98A" }} />
          <p className="font-display text-xl" style={{ color: "#2B2B2B" }}>No orders found</p>
        </div>
      ) : (
        <div className="card-ivory overflow-hidden">
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_140px_120px_100px_140px] gap-4 border-b px-5 py-3"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
          >
            {["Order", "Customer", "Amount", "Status", "Update Status"].map((h) => (
              <span key={h} className="text-[10px] font-bold tracking-widest" style={{ color: "#7A6E67" }}>
                {h.toUpperCase()}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: "#E5DCD3" }}>
            {filtered.map((order) => {
              const allowed    = TRANSITIONS[order.status] ?? [];
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_140px_120px_100px_140px] items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FAF7F4]"
                >
                  {/* Order number + date */}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                      {order.order_number}
                    </p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      {new Date(order.placed_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      {order.item_count} item{order.item_count !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Customer email */}
                  <p className="truncate text-xs" style={{ color: "#7A6E67" }}>
                    {order.user?.email ?? "—"}
                  </p>

                  {/* Amount */}
                  <p className="font-display text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
                  </p>

                  {/* Current status */}
                  <OrderStatusBadge status={order.status} />

                  {/* Status update dropdown */}
                  <div>
                    {allowed.length === 0 ? (
                      <span className="text-xs" style={{ color: "#C0B8B4" }}>No actions</span>
                    ) : (
                      <div className="relative">
                        <select
                          disabled={isUpdating}
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(order.id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="w-full appearance-none rounded-lg border py-1.5 pl-3 pr-7 text-xs outline-none transition-colors focus:border-[#C2A98A]"
                          style={{
                            borderColor:     "#E5DCD3",
                            backgroundColor: isUpdating ? "#EDE3D9" : "white",
                            color:           "#2B2B2B",
                          }}
                        >
                          <option value="">{isUpdating ? "Updating…" : "Change status"}</option>
                          {allowed.map((s) => (
                            <option key={s} value={s}>
                              → {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={11}
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                          style={{ color: "#7A6E67" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setPage((p) => p - 1)} disabled={!hasPrev} className="btn-outline px-5 py-2 disabled:opacity-40">
            Previous
          </button>
          <span className="flex items-center px-3 text-sm" style={{ color: "#7A6E67" }}>
            Page {page}
          </span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext} className="btn-primary px-5 py-2 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}