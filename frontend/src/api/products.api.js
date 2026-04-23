/**
 * products.api.js — all product-related HTTP calls.
 *
 * Every function is a direct 1-to-1 map to a Django endpoint.
 * No logic here — only axios calls.
 */
import axiosClient from "./axiosClient";

export const productsApi = {
  // ── Public ────────────────────────────────────────────────
  // GET /products/?category=shirts&size=M&min_price=500&ordering=-base_price&page=1
  getProducts: (params) =>
    axiosClient.get("/products/", { params }),

  // GET /products/<slug>/
  getProduct: (slug) =>
    axiosClient.get(`/products/${slug}/`),

  // GET /products/search/?q=shirt
  searchProducts: (q, params) =>
    axiosClient.get("/products/search/", { params: { q, ...params } }),

  // GET /categories/
  getCategories: () =>
    axiosClient.get("/categories/"),

  // GET /categories/<slug>/
  getCategory: (slug) =>
    axiosClient.get(`/categories/${slug}/`),

  // ── Admin ─────────────────────────────────────────────────
  createProduct: (data) =>
    axiosClient.post("/products/", data),

  updateProduct: (slug, data) =>
    axiosClient.patch(`/products/${slug}/`, data),

  deleteProduct: (slug) =>
    axiosClient.delete(`/products/${slug}/`),

  // Images — multipart/form-data
  uploadImage: (slug, formData) =>
    axiosClient.post(`/products/${slug}/images/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteImage: (slug, imageId) =>
    axiosClient.delete(`/products/${slug}/images/${imageId}/`),

  // Variants
  getVariants: (slug) =>
    axiosClient.get(`/products/${slug}/variants/`),

  createVariant: (slug, data) =>
    axiosClient.post(`/products/${slug}/variants/`, data),

  updateVariant: (slug, variantId, data) =>
    axiosClient.patch(`/products/${slug}/variants/${variantId}/`, data),

  deleteVariant: (slug, variantId) =>
    axiosClient.delete(`/products/${slug}/variants/${variantId}/`),

  createCategory: (data) =>
    axiosClient.post("/categories/", data),

  updateCategory: (slug, data) =>
    axiosClient.patch(`/categories/${slug}/`, data),
};