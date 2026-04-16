import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
