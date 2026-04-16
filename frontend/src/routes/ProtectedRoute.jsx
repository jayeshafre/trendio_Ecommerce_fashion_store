import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@store";
import { ROUTES } from "@constants";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  const isAdmin = useAuthStore((s) => s.isAdmin?.());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return <Outlet />;
}
