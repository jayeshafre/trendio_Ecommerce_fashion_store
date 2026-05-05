/**
 * AdminDashboard.jsx
 * Route: /admin
 *
 * Sections:
 *   - Stats cards (revenue, orders, pending, customers)
 *   - Revenue area chart (last 30 days) via recharts
 *   - Recent orders table
 *   - Low stock alerts
 *   - Payment method + order status breakdown
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Clock,
  Users, AlertTriangle, Package,
  CreditCard, Banknote,
} from "lucide-react";
import { useAdminDashboard } from "@hooks/useAdmin";

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg }) {
  return (
    <div className="card-ivory p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest" style={{ color: "#7A6E67" }}>
          {label}
        </p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="font-display text-2xl font-semibold" style={{ color: "#2B2B2B" }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "#7A6E67" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Custom Tooltip for chart ──────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-4 py-3 shadow-sm"
      style={{ backgroundColor: "white", borderColor: "#E5DCD3" }}
    >
      <p className="mb-1 text-xs font-semibold" style={{ color: "#7A6E67" }}>
        {label}
      </p>
      <p className="text-sm font-bold" style={{ color: "#2B2B2B" }}>
        ₹{parseFloat(payload[0].value).toLocaleString("en-IN")}
      </p>
      <p className="text-xs" style={{ color: "#C2A98A" }}>
        {payload[0].payload.orders} order{payload[0].payload.orders !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Status label map ──────────────────────────────────────────
const STATUS_COLORS = {
  pending:   { bg: "#FFF8EE", color: "#D97757" },
  confirmed: { bg: "#EDE3D9", color: "#C2A98A" },
  shipped:   { bg: "#EFF6FF", color: "#2563eb" },
  delivered: { bg: "#F0FDF4", color: "#16a34a" },
  cancelled: { bg: "#FDF3F0", color: "#D97757" },
};

export default function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm" style={{ color: "#D97757" }}>
          Failed to load dashboard. Check your backend connection.
        </p>
      </div>
    );
  }

  const {
    stats,
    revenue_chart,
    recent_orders,
    low_stock,
    status_breakdown,
    payment_breakdown,
  } = data;

  // Format chart data for recharts
  const chartData = revenue_chart.map((row) => ({
    date:    new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    revenue: row.revenue,
    orders:  row.orders,
  }));

  // Payment breakdown
  const codCount    = payment_breakdown.find((p) => p.payment_method === "cod")?.count    || 0;
  const onlineCount = payment_breakdown.find((p) => p.payment_method === "online")?.count || 0;
  const totalPM     = codCount + onlineCount || 1;

  return (
    <div className="space-y-6 py-6 pr-2">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>
          ADMIN
        </p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>
          Dashboard
        </h1>
      </div>

      {/* ── Stats cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={`₹${parseFloat(stats.total_revenue).toLocaleString("en-IN")}`}
          sub={`₹${parseFloat(stats.revenue_today).toLocaleString("en-IN")} today`}
          icon={TrendingUp}
          iconColor="#16a34a"
          iconBg="#F0FDF4"
        />
        <StatCard
          label="Total Orders"
          value={stats.total_orders}
          sub={`${stats.orders_today} today`}
          icon={ShoppingBag}
          iconColor="#C2A98A"
          iconBg="#EDE3D9"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pending_orders}
          sub="Awaiting confirmation"
          icon={Clock}
          iconColor="#D97757"
          iconBg="#FDF3F0"
        />
        <StatCard
          label="Total Customers"
          value={stats.total_customers}
          sub={`${stats.new_customers_today} joined today`}
          icon={Users}
          iconColor="#2563eb"
          iconBg="#EFF6FF"
        />
      </div>

      {/* ── Revenue chart ────────────────────────────────── */}
      <div className="card-ivory p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg" style={{ color: "#2B2B2B" }}>
              Revenue — Last 30 Days
            </h2>
            <p className="text-xs" style={{ color: "#7A6E67" }}>
              ₹{parseFloat(stats.revenue_this_month).toLocaleString("en-IN")} this month
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl" style={{ backgroundColor: "#F8F5F2" }}>
            <p className="text-sm" style={{ color: "#7A6E67" }}>No revenue data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C2A98A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C2A98A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#7A6E67" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#7A6E67" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C2A98A"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#C2A98A" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Recent orders + Low stock ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Recent orders */}
        <div className="card-ivory overflow-hidden">
          <div
            className="border-b px-5 py-4"
            style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
          >
            <h2 className="font-display text-base" style={{ color: "#2B2B2B" }}>
              Recent Orders
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#E5DCD3" }}>
            {recent_orders.length === 0 ? (
              <p className="px-5 py-6 text-sm" style={{ color: "#7A6E67" }}>No orders yet.</p>
            ) : (
              recent_orders.map((order) => {
                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <div key={order.id} className="flex items-center gap-4 px-5 py-3">
                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                        {order.order_number}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: "#7A6E67" }}>
                        {order.user_name}
                      </p>
                    </div>
                    {/* Status */}
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest"
                      style={{ backgroundColor: sc.bg, color: sc.color }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                    {/* Payment */}
                    <span className="shrink-0">
                      {order.payment_method === "cod"
                        ? <Banknote size={13} style={{ color: "#C2A98A" }} />
                        : <CreditCard size={13} style={{ color: "#2563eb" }} />
                      }
                    </span>
                    {/* Amount */}
                    <p className="shrink-0 text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                      ₹{parseFloat(order.total_amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Low stock + breakdowns */}
        <div className="space-y-6">

          {/* Low stock */}
          <div className="card-ivory overflow-hidden">
            <div
              className="flex items-center gap-2 border-b px-5 py-4"
              style={{ borderColor: "#E5DCD3", backgroundColor: "#FAF7F4" }}
            >
              <AlertTriangle size={14} style={{ color: "#D97757" }} />
              <h2 className="font-display text-base" style={{ color: "#2B2B2B" }}>
                Low Stock
              </h2>
            </div>
            <div className="divide-y max-h-52 overflow-y-auto" style={{ borderColor: "#E5DCD3" }}>
              {low_stock.length === 0 ? (
                <p className="px-5 py-4 text-xs" style={{ color: "#7A6E67" }}>
                  All variants are well-stocked ✓
                </p>
              ) : (
                low_stock.map((v) => (
                  <div key={v.variant_id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: v.is_out ? "#FDF3F0" : "#FFF8EE" }}
                    >
                      <Package
                        size={14}
                        style={{ color: v.is_out ? "#D97757" : "#f59e0b" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                        {v.product_title}
                      </p>
                      <p className="text-[10px]" style={{ color: "#7A6E67" }}>
                        {v.size} · {v.color} · SKU: {v.sku}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: v.is_out ? "#FDF3F0" : "#FFF8EE",
                        color:           v.is_out ? "#D97757" : "#f59e0b",
                      }}
                    >
                      {v.is_out ? "OUT" : v.stock}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order status breakdown */}
          <div className="card-ivory p-5">
            <h2 className="mb-4 font-display text-base" style={{ color: "#2B2B2B" }}>
              Orders by Status
            </h2>
            <div className="space-y-2.5">
              {status_breakdown.map(({ status, count }) => {
                const sc    = STATUS_COLORS[status] || STATUS_COLORS.pending;
                const total = status_breakdown.reduce((a, b) => a + b.count, 0) || 1;
                const pct   = Math.round((count / total) * 100);
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className="text-xs font-semibold capitalize"
                        style={{ color: sc.color }}
                      >
                        {status}
                      </span>
                      <span className="text-xs" style={{ color: "#7A6E67" }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: "#EDE3D9" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: sc.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment method breakdown */}
          <div className="card-ivory p-5">
            <h2 className="mb-4 font-display text-base" style={{ color: "#2B2B2B" }}>
              Payment Methods
            </h2>
            <div className="space-y-3">
              {/* Online */}
              <div className="flex items-center gap-3">
                <CreditCard size={14} style={{ color: "#2563eb" }} />
                <div className="flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                      Pay Online
                    </span>
                    <span className="text-xs" style={{ color: "#7A6E67" }}>
                      {onlineCount} ({Math.round((onlineCount / totalPM) * 100)}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "#EDE3D9" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((onlineCount / totalPM) * 100)}%`,
                        backgroundColor: "#2563eb",
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* COD */}
              <div className="flex items-center gap-3">
                <Banknote size={14} style={{ color: "#C2A98A" }} />
                <div className="flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#2B2B2B" }}>
                      Cash on Delivery
                    </span>
                    <span className="text-xs" style={{ color: "#7A6E67" }}>
                      {codCount} ({Math.round((codCount / totalPM) * 100)}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "#EDE3D9" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((codCount / totalPM) * 100)}%`,
                        backgroundColor: "#C2A98A",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 py-6 pr-2">
      <div className="skeleton h-9 w-48 rounded" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-64 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="skeleton h-80 rounded-xl" />
        <div className="space-y-4">
          <div className="skeleton h-52 rounded-xl" />
          <div className="skeleton h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}