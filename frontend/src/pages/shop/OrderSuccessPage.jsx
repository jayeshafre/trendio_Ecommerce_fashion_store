/**
 * OrderSuccessPage.jsx — FIXED
 * Route: /order/success/:id
 *
 * Fix: Pay Now button moved to TOP (before order card) when UNPAID
 * so it's always visible without scrolling.
 *
 * Also guards payment_status comparison with .toLowerCase()
 * in case backend returns "Unpaid" vs "unpaid".
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2, Package, ArrowRight,
  ShoppingBag, CreditCard, AlertTriangle, Clock,
} from "lucide-react";
import { useOrderDetail } from "@hooks/useOrders";
import { useInitiatePayment } from "@hooks/usePayments";
import { ROUTES } from "@constants";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [paymentFailed, setPaymentFailed] = useState(false);

  const { data: order, isLoading, isError, refetch } = useOrderDetail(id);
  const { initiatePayment, isLoading: isPaying }      = useInitiatePayment();

  const handlePayNow = () => {
    setPaymentFailed(false);
    initiatePayment({
      orderId:   id,
      onSuccess: () => refetch(),
      onFailure: (err) => {
        if (err?.description !== "Payment cancelled by user.") {
          setPaymentFailed(true);
        }
      },
    });
  };

  if (isLoading) return <SuccessSkeleton />;

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>Order not found</p>
        <Link to={ROUTES.ORDERS} className="btn-primary">View All Orders</Link>
      </div>
    );
  }

  // Guard: case-insensitive compare
  const paymentStatus = (order.payment_status || "").toLowerCase();
  const orderStatus   = (order.status || "").toLowerCase();

  const isPaid      = paymentStatus === "paid";
  const isCancelled = orderStatus === "cancelled";
  const isUnpaid    = !isPaid && !isCancelled;

  // ── State config ──────────────────────────────────────────
  const cfg = isPaid ? {
    iconBg:     "#F0FDF4",
    icon:       <CheckCircle2 size={44} style={{ color: "#16a34a" }} strokeWidth={1.5} />,
    label:      "PAYMENT SUCCESSFUL",
    labelColor: "#16a34a",
    title:      "Order Confirmed!",
    subtitle:   "Your order is confirmed and will be processed shortly.",
  } : isCancelled ? {
    iconBg:     "#FDF3F0",
    icon:       <AlertTriangle size={44} style={{ color: "#D97757" }} strokeWidth={1.5} />,
    label:      "ORDER CANCELLED",
    labelColor: "#D97757",
    title:      "Order Cancelled",
    subtitle:   "This order has been cancelled.",
  } : {
    iconBg:     "#EDE3D9",
    icon:       <Clock size={44} style={{ color: "#C2A98A" }} strokeWidth={1.5} />,
    label:      "PAYMENT PENDING",
    labelColor: "#C2A98A",
    title:      "Almost there!",
    subtitle:   "Your order is saved. Complete payment to confirm it.",
  };

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12 animate-fade-in">

      {/* ── Status header ─────────────────────────────────── */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: cfg.iconBg }}
        >
          {cfg.icon}
        </div>
        <p className="mb-1 text-xs font-semibold tracking-[0.2em]" style={{ color: cfg.labelColor }}>
          {cfg.label}
        </p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>{cfg.title}</h1>
        <p className="mt-2 text-sm" style={{ color: "#7A6E67" }}>{cfg.subtitle}</p>

        {/* Order number chip */}
        <div className="mt-4 rounded-xl px-5 py-2.5" style={{ backgroundColor: "#EDE3D9" }}>
          <span className="text-xs font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
            ORDER
          </span>
          <span className="ml-2 font-display text-lg" style={{ color: "#2B2B2B" }}>
            {order.order_number}
          </span>
        </div>
      </div>

      {/* ── PAY NOW — shown ABOVE order card so always visible ── */}
      {isUnpaid && (
        <div className="mb-5 space-y-3">
          {/* Payment failed warning */}
          {paymentFailed && (
            <div
              className="rounded-xl border p-4 animate-fade-in"
              style={{ borderColor: "#D97757", backgroundColor: "#FDF3F0" }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: "#D97757" }} />
                <p className="text-sm font-semibold" style={{ color: "#D97757" }}>Payment failed</p>
              </div>
              <p className="mt-1 text-xs" style={{ color: "#7A6E67" }}>
                Your order is saved. You won't be charged twice — try again below.
              </p>
            </div>
          )}

          {/* Pay Now button — prominent, full width */}
          <button
            onClick={handlePayNow}
            disabled={isPaying}
            className="btn-primary w-full justify-center py-4"
            style={{ fontSize: "0.9rem" }}
          >
            {isPaying ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Opening Payment…
              </span>
            ) : (
              <>
                <CreditCard size={17} />
                Pay ₹{parseFloat(order.total_amount).toLocaleString("en-IN")} Now
              </>
            )}
          </button>

          <p className="text-center text-[10px]" style={{ color: "#7A6E67" }}>
            🔒 Secured by Razorpay · 256-bit SSL encryption
          </p>
        </div>
      )}

      {/* ── Order card ────────────────────────────────────── */}
      <div className="card-ivory overflow-hidden mb-5">

        {/* Items */}
        <div className="divide-y" style={{ borderColor: "#E5DCD3" }}>
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#EDE3D9" }}
              >
                <Package size={18} style={{ color: "#C2A98A" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: "#2B2B2B" }}>
                  {item.product_title}
                </p>
                <p className="text-xs" style={{ color: "#7A6E67" }}>
                  {item.variant_detail} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold shrink-0" style={{ color: "#2B2B2B" }}>
                ₹{parseFloat(item.line_total).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div
          className="border-t px-6 py-5 space-y-2"
          style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
        >
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
          <div className="flex justify-between border-t pt-2" style={{ borderColor: "#E5DCD3" }}>
            <span className="font-semibold" style={{ color: "#2B2B2B" }}>
              {isPaid ? "Total Paid" : "Total"}
            </span>
            <span className="font-display text-xl" style={{ color: "#2B2B2B" }}>
              ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Shipping */}
        <div className="border-t px-6 py-4" style={{ borderColor: "#E5DCD3" }}>
          <p className="mb-1 text-[10px] font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
            DELIVERING TO
          </p>
          <p className="text-sm font-medium" style={{ color: "#2B2B2B" }}>{order.shipping_name}</p>
          <p className="text-xs" style={{ color: "#7A6E67" }}>{order.shipping_address_full}</p>
          <p className="text-xs" style={{ color: "#7A6E67" }}>{order.shipping_phone}</p>
        </div>

        {/* Payment status strip */}
        <div
          className="border-t px-6 py-3 flex items-center justify-between"
          style={{
            borderColor:     "#E5DCD3",
            backgroundColor: isPaid ? "#F0FDF4" : isCancelled ? "#FDF3F0" : "#FFF8EE",
          }}
        >
          <div className="flex items-center gap-2">
            <CreditCard
              size={13}
              style={{ color: isPaid ? "#16a34a" : isCancelled ? "#9CA3AF" : "#D97757" }}
            />
            <span className="text-xs font-semibold"
              style={{ color: isPaid ? "#16a34a" : isCancelled ? "#9CA3AF" : "#D97757" }}>
              {isPaid ? "Payment Complete" : isCancelled ? "Order Cancelled" : "Payment Pending"}
            </span>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
            style={{
              backgroundColor: isPaid ? "#dcfce7" : isCancelled ? "#f3f4f6" : "#FEF3C7",
              color:           isPaid ? "#16a34a" : isCancelled ? "#9CA3AF" : "#D97757",
            }}
          >
            {isPaid ? "PAID" : isCancelled ? "CANCELLED" : "UNPAID"}
          </span>
        </div>
      </div>

      {/* ── Bottom CTAs ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to={ROUTES.ORDERS} className="btn-primary flex-1 justify-center">
          <Package size={14} />
          {isPaid ? "Track Order" : "My Orders"}
          <ArrowRight size={14} />
        </Link>
        <Link to={ROUTES.SHOP} className="btn-outline flex-1 justify-center">
          <ShoppingBag size={14} />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

function SuccessSkeleton() {
  return (
    <div className="mx-auto max-w-[640px] px-6 py-16 text-center">
      <div className="skeleton mx-auto mb-6 h-20 w-20 rounded-full" />
      <div className="skeleton mx-auto mb-2 h-8 w-48 rounded" />
      <div className="skeleton mx-auto mb-8 h-4 w-64 rounded" />
      <div className="skeleton h-12 w-full rounded-xl mb-4" />
      <div className="skeleton h-64 w-full rounded-xl" />
    </div>
  );
}