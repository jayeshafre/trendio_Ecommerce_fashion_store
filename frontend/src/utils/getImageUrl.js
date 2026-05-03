/*
 *
 * This utility handles both cases safely.
 * Import and use everywhere an image src is rendered.
 *
 * Usage:
 *   import { getImageUrl } from "@utils";
 *   <img src={getImageUrl(product.primary_image)} />
 */

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE_URL
  || import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "")
  || "http://localhost:8000";

/**
 * Converts a Django image path to a full URL.
 * @param {string|null|undefined} path - image path from API
 * @returns {string|null} - full URL or null if no image
 */
export function getImageUrl(path) {
  if (!path) return null;

  // Already a full URL (http or https)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Relative path — prepend media base
  const cleanBase = MEDIA_BASE.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}