import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ─── Tailwind class merger ──────────────────────────────────
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatter (INR) ──────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Date formatters ───────────────────────────────────────
export function formatDate(date) {
  return format(new Date(date), "dd MMM yyyy");
}

export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ─── API error extractor ───────────────────────────────────
export function getApiError(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    Object.values(error?.response?.data || {})[0]?.[0] ||
    "Something went wrong. Please try again."
  );
}

// ─── Truncate text ─────────────────────────────────────────
export function truncate(str, n = 100) {
  return str?.length > n ? `${str.substring(0, n)}...` : str;
}

 

