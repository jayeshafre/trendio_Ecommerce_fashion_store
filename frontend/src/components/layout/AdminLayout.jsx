import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile/tablet top bar — only the sidebar-toggle, hidden at md+
            where the sidebar is always visible */}
        <div
          className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 md:hidden"
          style={{ borderColor: "#E5DCD3" }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1"
          >
            <Menu size={22} style={{ color: "#2B2B2B" }} strokeWidth={1.5} />
          </button>
          <span
            className="font-display text-lg italic"
            style={{ color: "#2B2B2B" }}
          >
            Trendio{" "}
            <span
              className="align-middle text-[9px] font-bold not-italic tracking-widest"
              style={{ color: "#C2A98A" }}
            >
              ADMIN
            </span>
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}