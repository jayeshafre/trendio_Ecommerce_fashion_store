/**
 * OrderStatusBadge.jsx — reusable status pill
 * Used in: OrdersPage, OrderDetailPage, AdminOrders
 */
export default function OrderStatusBadge({ status }) {
  const config = {
    pending:   { label: "Pending",   bg: "#FFF8EE", color: "#D97757", dot: "#D97757" },
    confirmed: { label: "Confirmed", bg: "#EEF7FF", color: "#2563eb", dot: "#2563eb" },
    shipped:   { label: "Shipped",   bg: "#F0F4FF", color: "#7C3AED", dot: "#7C3AED" },
    delivered: { label: "Delivered", bg: "#F0FDF4", color: "#16a34a", dot: "#16a34a" },
    cancelled: { label: "Cancelled", bg: "#FDF3F0", color: "#9CA3AF", dot: "#9CA3AF" },
  };

  const c = config[status] ?? { label: status, bg: "#EDE3D9", color: "#7A6E67", dot: "#7A6E67" };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-widest"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: c.dot }}
      />
      {c.label.toUpperCase()}
    </span>
  );
}