/**
 * OrderSuccessPage.jsx
 * Route: /order/success/:id
 * Shows order confirmation with order details summary.
 */
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { useOrderDetail } from "@hooks/useOrders";
import { ROUTES } from "@constants";

export default function OrderSuccessPage() {
  const { id }                              = useParams();
  const { data: order, isLoading, isError } = useOrderDetail(id);

  if (isLoading) return <SuccessSkeleton />;

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>Order not found</p>
        <Link to={ROUTES.ORDERS} className="btn-primary">View All Orders</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 py-16 animate-fade-in">
      {/* Success icon */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: "#EDE3D9" }}
        >
          <CheckCircle2 size={44} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
        </div>

        <p className="mb-1 text-xs font-semibold tracking-[0.2em]" style={{ color: "#C2A98A" }}>
          ORDER CONFIRMED
        </p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>
          Thank you!
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#7A6E67" }}>
          Your order has been placed successfully. We'll notify you once it ships.
        </p>
        <div
          className="mt-4 rounded-xl px-5 py-2.5"
          style={{ backgroundColor: "#EDE3D9" }}
        >
          <span className="text-xs font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
            ORDER
          </span>
          <span className="ml-2 font-display text-lg" style={{ color: "#2B2B2B" }}>
            {order.order_number}
          </span>
        </div>
      </div>

      {/* Order card */}
      <div className="card-ivory overflow-hidden">
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
              <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                ₹{parseFloat(item.line_total).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t px-6 py-5 space-y-2" style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}>
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
            <span className="font-semibold" style={{ color: "#2B2B2B" }}>Total Paid</span>
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
          <p className="text-sm font-medium" style={{ color: "#2B2B2B" }}>
            {order.shipping_name}
          </p>
          <p className="text-xs" style={{ color: "#7A6E67" }}>
            {order.shipping_address_full}
          </p>
          <p className="text-xs" style={{ color: "#7A6E67" }}>
            {order.shipping_phone}
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to={ROUTES.ORDERS} className="btn-primary flex-1 justify-center">
          <Package size={14} />
          Track Orders
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
      <div className="skeleton h-64 w-full rounded-xl" />
    </div>
  );
}