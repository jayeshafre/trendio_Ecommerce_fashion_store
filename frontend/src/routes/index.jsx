// src/routes/index.jsx
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute, AdminRoute, GuestRoute } from "./ProtectedRoute";
import RootLayout from "@components/layout/RootLayout";
import AdminLayout from "@components/layout/AdminLayout";
import PageSpinner from "@components/common/PageSpinner";

const HomePage           = lazy(() => import("@pages/shop/HomePage"));
const ShopPage           = lazy(() => import("@pages/shop/ShopPage"));
const ProductDetailPage  = lazy(() => import("@pages/shop/ProductDetailPage"));
const CartPage           = lazy(() => import("@pages/shop/CartPage"));
const CheckoutPage       = lazy(() => import("@pages/shop/CheckoutPage"));
const OrderSuccessPage   = lazy(() => import("@pages/shop/OrderSuccessPage"));

const LoginPage          = lazy(() => import("@pages/auth/LoginPage"));
const RegisterPage       = lazy(() => import("@pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@pages/auth/ForgotPasswordPage"));
const ResetPasswordPage  = lazy(() => import("@pages/auth/ResetPasswordPage"));

const AccountPage        = lazy(() => import("@pages/account/AccountPage"));
const OrdersPage         = lazy(() => import("@pages/account/OrdersPage"));
const OrderDetailPage    = lazy(() => import("@pages/account/OrderDetailPage"));
const ProfilePage        = lazy(() => import("@pages/account/ProfilePage"));

const AdminDashboard     = lazy(() => import("@pages/admin/AdminDashboard"));
const AdminProducts      = lazy(() => import("@pages/admin/AdminProducts"));
const AdminOrders        = lazy(() => import("@pages/admin/AdminOrders"));
const AdminUsers         = lazy(() => import("@pages/admin/AdminUsers"));

const NotFoundPage       = lazy(() => import("@pages/error/NotFoundPage"));

const S = ({ children }) => (
  <Suspense fallback={<PageSpinner />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true,           element: <S><HomePage /></S> },
      { path: "shop",          element: <S><ShopPage /></S> },
      { path: "product/:slug", element: <S><ProductDetailPage /></S> },
      { path: "search",        element: <S><ShopPage /></S> },

      // Guest only (redirect to home if already logged in)
      {
        element: <GuestRoute />,
        children: [
          { path: "auth/login",           element: <S><LoginPage /></S> },
          { path: "auth/register",        element: <S><RegisterPage /></S> },
          { path: "auth/forgot-password", element: <S><ForgotPasswordPage /></S> },
          { path: "auth/reset-password",  element: <S><ResetPasswordPage /></S> },
        ],
      },

      // Protected customer routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "cart",               element: <S><CartPage /></S> },
          { path: "checkout",           element: <S><CheckoutPage /></S> },
          { path: "order/success/:id",  element: <S><OrderSuccessPage /></S> },
          { path: "account",            element: <S><AccountPage /></S> },
          { path: "account/orders",     element: <S><OrdersPage /></S> },
          { path: "account/orders/:id", element: <S><OrderDetailPage /></S> },
          { path: "account/profile",    element: <S><ProfilePage /></S> },
        ],
      },
    ],
  },

  // Admin routes
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,      element: <S><AdminDashboard /></S> },
          { path: "products", element: <S><AdminProducts /></S> },
          { path: "orders",   element: <S><AdminOrders /></S> },
          { path: "users",    element: <S><AdminUsers /></S> },
        ],
      },
    ],
  },

  { path: "*", element: <S><NotFoundPage /></S> },
]);