/**
 * OrdersPage.jsx
 * Route: /account/orders
 * Shows paginated order history with status badges and quick links.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Filter, ShoppingBag } from "lucide-react";
import { useOrders } from "@hooks/useOrders";
import { ROUTES } from "@constants";
import OrderStatusBadge from "./components/OrderStatusBadge";

const STATUS_FILTERS = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped",   value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]                 = useState(1);

  const { data, isLoading, isError } = useOrders({
    ...(statusFilter && { status: statusFilter }),
    page,
  });

  const orders  = data?.results ?? [];
  const count   = data?.count   ?? 0;
  const hasNext = !!data?.next;
  const hasPrev = !!data?.previous;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>ACCOUNT</p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>My Orders</h1>
        {count > 0 && (
          <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>{count} order{count !== 1 ? "s" : ""} total</p>
        )}
      </div>

      {/* Status filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter size={13} style={{ color: "#7A6E67" }} />
        {STATUS_FILTERS.map(({ label, value }) => {
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className="rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150"
              style={{
                backgroundColor: isActive ? "#C2A98A"  : "#EDE3D9",
                color:           isActive ? "white"    : "#7A6E67",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <OrderCardSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#FDF3F0" }}>
          <p className="text-sm" style={{ color: "#D97757" }}>Failed to load orders. Please try again.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EDE3D9" }}
          >
            <ShoppingBag size={36} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          </div>
          <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>No orders yet</p>
          <p className="mt-2 text-sm" style={{ color: "#7A6E67" }}>
            {statusFilter
              ? `No ${statusFilter} orders found.`
              : "Start shopping to see your orders here."}
          </p>
          <Link to={ROUTES.SHOP} className="btn-primary mt-6">
            Explore Collection
          </Link>
        </div>
      )}

      {/* Order list */}
      {!isLoading && orders.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.id}`}
              className="card-ivory block p-5 transition-shadow duration-150 hover:shadow-ivory-md"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "#EDE3D9" }}
                  >
                    <Package size={20} style={{ color: "#C2A98A" }} />
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold" style={{ color: "#2B2B2B" }}>
                      {order.order_number}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "#7A6E67" }}>
                      {order.item_count} item{order.item_count !== 1 ? "s" : ""} · Placed{" "}
                      {new Date(order.placed_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentBadge status={order.payment_status} />
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="font-display text-lg font-semibold" style={{ color: "#2B2B2B" }}>
                      ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "#C2A98A" }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasNext || hasPrev) && (
        <div className="mt-8 flex justify-center gap-3">
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
    </div>
  );
}

function PaymentBadge({ status }) {
  const config = {
    unpaid:   { label: "Unpaid",   bg: "#FDF3F0", color: "#D97757" },
    paid:     { label: "Paid",     bg: "#F0FDF4", color: "#16a34a" },
    refunded: { label: "Refunded", bg: "#EFF6FF", color: "#2563eb" },
  };
  const c = config[status] ?? { label: status, bg: "#EDE3D9", color: "#7A6E67" };
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {c.label.toUpperCase()}
    </span>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="card-ivory p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-3 w-56 rounded" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="skeleton h-7 w-20 rounded" />
      </div>
    </div>
  );
}