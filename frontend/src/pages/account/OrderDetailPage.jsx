/**
 * OrderDetailPage.jsx
 * Route: /account/orders/:id
 * Full order detail: items, shipping snapshot, payment status, cancel CTA.
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Package, MapPin, CreditCard, ChevronLeft,
  AlertTriangle, X,
} from "lucide-react";
import { useOrderDetail, useCancelOrder } from "@hooks/useOrders";
import OrderStatusBadge from "./components/OrderStatusBadge";
import { ROUTES } from "@constants";

export default function OrderDetailPage() {
  const { id }     = useParams();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: order, isLoading, isError } = useOrderDetail(id);
  const cancelOrder = useCancelOrder();

  const handleCancel = () => {
    cancelOrder.mutate(id, {
      onSuccess: () => setShowCancelConfirm(false),
    });
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>Order not found</p>
        <Link to={ROUTES.ORDERS} className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 animate-fade-in">
      {/* Back */}
      <Link
        to={ROUTES.ORDERS}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold tracking-widest transition-opacity hover:opacity-60"
        style={{ color: "#7A6E67" }}
      >
        <ChevronLeft size={14} />
        ALL ORDERS
      </Link>

      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>
            ORDER
          </p>
          <h1 className="font-display text-2xl" style={{ color: "#2B2B2B" }}>
            {order.order_number}
          </h1>
          <p className="mt-1 text-xs" style={{ color: "#7A6E67" }}>
            Placed on{" "}
            {new Date(order.placed_at).toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column ─────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Items */}
          <section className="card-ivory overflow-hidden">
            <div
              className="flex items-center gap-2 border-b px-6 py-4"
              style={{ borderColor: "#E5DCD3" }}
            >
              <Package size={15} style={{ color: "#C2A98A" }} />
              <h2 className="font-display text-base">Items Ordered</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#E5DCD3" }}>
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "#EDE3D9" }}
                  >
                    <Package size={18} style={{ color: "#C2A98A" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "#2B2B2B" }}>
                      {item.product_title}
                    </p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      {item.variant_detail}
                    </p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      Qty: {item.quantity} × ₹{parseFloat(item.unit_price).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                    ₹{parseFloat(item.line_total).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Shipping */}
          <section className="card-ivory p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={15} style={{ color: "#C2A98A" }} />
              <h2 className="font-display text-base">Delivery Address</h2>
            </div>
            <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
              {order.shipping_name}
            </p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "#7A6E67" }}>
              {order.shipping_address_full}
            </p>
            <p className="mt-1 text-sm" style={{ color: "#7A6E67" }}>
              📞 {order.shipping_phone}
            </p>
          </section>

          {/* Cancel button */}
          {order.can_cancel && (
            <div>
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex items-center gap-2 text-xs font-semibold tracking-wide transition-opacity hover:opacity-70"
                  style={{ color: "#D97757" }}
                >
                  <X size={13} />
                  Cancel this order
                </button>
              ) : (
                <div
                  className="rounded-xl border p-5"
                  style={{ borderColor: "#D97757", backgroundColor: "#FDF3F0" }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle size={15} style={{ color: "#D97757" }} />
                    <p className="text-sm font-semibold" style={{ color: "#D97757" }}>
                      Cancel this order?
                    </p>
                  </div>
                  <p className="mb-4 text-xs" style={{ color: "#7A6E67" }}>
                    This action cannot be undone. Stock will be restored.
                    {order.payment_status === "paid" && " A refund will be initiated."}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={cancelOrder.isPending}
                      className="rounded-xl px-5 py-2.5 text-xs font-bold tracking-wider text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: "#D97757" }}
                    >
                      {cancelOrder.isPending ? "Cancelling…" : "Yes, Cancel Order"}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="btn-outline px-5 py-2.5 text-xs"
                    >
                      Keep Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column: summary ─────────────────────────── */}
        <div className="space-y-5">
          {/* Price summary */}
          <section className="card-ivory p-6">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard size={15} style={{ color: "#C2A98A" }} />
              <h2 className="font-display text-base">Price Summary</h2>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm" style={{ color: "#7A6E67" }}>
                <span>Subtotal</span>
                <span>₹{parseFloat(order.subtotal).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#7A6E67" }}>
                <span>Delivery</span>
                <span>
                  {parseFloat(order.delivery_charge) === 0 ? (
                    <span style={{ color: "#84cc16", fontWeight: 600 }}>FREE</span>
                  ) : (
                    `₹${parseFloat(order.delivery_charge).toLocaleString("en-IN")}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2.5" style={{ borderColor: "#E5DCD3" }}>
                <span className="font-semibold" style={{ color: "#2B2B2B" }}>Total</span>
                <span className="font-display text-xl" style={{ color: "#2B2B2B" }}>
                  ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="card-ivory p-6">
            <h2 className="mb-4 font-display text-base">Order Timeline</h2>
            <OrderTimeline status={order.status} placedAt={order.placed_at} updatedAt={order.updated_at} />
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="card-ivory p-5">
              <p className="mb-1 text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
                DELIVERY INSTRUCTIONS
              </p>
              <p className="text-sm" style={{ color: "#2B2B2B" }}>{order.notes}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order Status Timeline ─────────────────────────────────────
const STEPS = [
  { key: "pending",   label: "Order Placed"  },
  { key: "confirmed", label: "Confirmed"     },
  { key: "shipped",   label: "Shipped"       },
  { key: "delivered", label: "Delivered"     },
];

function OrderTimeline({ status, placedAt, updatedAt }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl p-3" style={{ backgroundColor: "#FDF3F0" }}>
        <X size={14} style={{ color: "#D97757" }} />
        <p className="text-xs font-semibold" style={{ color: "#D97757" }}>Order Cancelled</p>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
              style={{
                borderColor:     isDone || isCurrent ? "#C2A98A" : "#E5DCD3",
                backgroundColor: isDone ? "#C2A98A" : isCurrent ? "#FAF7F4" : "transparent",
              }}
            >
              {isDone ? (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : isCurrent ? (
                <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: "#C2A98A" }} />
              ) : null}
            </div>
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: isDone || isCurrent ? "#2B2B2B" : "#C0B8B4" }}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-[10px]" style={{ color: "#7A6E67" }}>
                  {new Date(updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
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

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-10 space-y-6">
      <div className="skeleton h-6 w-32 rounded" />
      <div className="skeleton h-8 w-56 rounded" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-28 rounded-xl" />
        </div>
        <div className="space-y-5">
          <div className="skeleton h-40 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}