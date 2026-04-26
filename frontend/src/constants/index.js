/**
 * src/constants/index.js — FIXED
 *
 * Fix: Added missing ROUTES.WISHLIST
 * Was: undefined → Link got to={undefined} → click did nothing
 * Now: "/account/wishlist" → works correctly
 */

// ─── API ────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ─── Auth Token Keys ────────────────────────────────────────
export const ACCESS_TOKEN_KEY  = "trendio_access";
export const REFRESH_TOKEN_KEY = "trendio_refresh";

// ─── User Roles ─────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN:    "admin",
  CUSTOMER: "customer",
};

// ─── Query Keys ─────────────────────────────────────────────
export const QUERY_KEYS = {
  AUTH: {
    ME: ["auth", "me"],
  },
  PRODUCTS: {
    ALL:    (params) => ["products", params],
    DETAIL: (id)     => ["products", id],
  },
  CART: {
    DETAIL: ["cart"],
  },
  ORDERS: {
    ALL:    ["orders"],
    DETAIL: (id) => ["orders", id],
  },
};

// ─── Pagination ──────────────────────────────────────────────
export const PAGE_SIZE = 20;

// ─── Route Paths ─────────────────────────────────────────────
export const ROUTES = {
  HOME:            "/",
  LOGIN:           "/auth/login",
  REGISTER:        "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD:  "/auth/reset-password",

  SHOP:            "/shop",
  PRODUCT:         "/product/:slug",
  SEARCH:          "/search",

  CART:            "/cart",
  CHECKOUT:        "/checkout",
  ORDER_SUCCESS:   "/order/success/:id",

  ACCOUNT:         "/account",
  ORDERS:          "/account/orders",
  ORDER_DETAIL:    "/account/orders/:id",
  PROFILE:         "/account/profile",
  ADDRESSES:       "/account/addresses",
  WISHLIST:        "/account/wishlist",   // ← FIX: was missing, caused undefined href

  ADMIN:           "/admin",
  ADMIN_PRODUCTS:  "/admin/products",
  ADMIN_ORDERS:    "/admin/orders",
  ADMIN_USERS:     "/admin/users",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_BULK_UPLOAD: "/admin/products/bulk-upload",
};