/**
 * useProducts.js — React Query hooks for the products module.
 *
 * Exports:
 *   useProducts(params)      → paginated product list with filters
 *   useProduct(slug)         → single product detail
 *   useSearchProducts(q)     → keyword search results
 *   useCategories()          → all top-level categories
 *   useCategory(slug)        → single category with children
 *   useCreateProduct()       → admin: create product
 *   useUpdateProduct()       → admin: update product
 *   useDeleteProduct()       → admin: soft-delete product
 *   useUploadImage()         → admin: upload product image
 *   useDeleteImage()         → admin: delete image
 *   useCreateVariant()       → admin: add variant
 *   useUpdateVariant()       → admin: update variant stock/price
 *   useDeleteVariant()       → admin: remove variant
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { productsApi } from "@api";
import { getApiError } from "@utils";

// ── Query key factory — keeps cache keys consistent ───────────
const K = {
  products:   (p)    => ["products", "list", p],
  product:    (slug) => ["products", "detail", slug],
  search:     (q, p) => ["products", "search", q, p],
  categories: ()     => ["categories"],
  category:   (slug) => ["categories", slug],
};

// ─────────────────────────────────────────────────────────────
// PUBLIC HOOKS
// ─────────────────────────────────────────────────────────────

/**
 * useProducts — paginated product list.
 * params: { category, brand, min_price, max_price, size, color,
 *           in_stock, ordering, page, search }
 */
export function useProducts(params = {}) {
  return useQuery({
    queryKey: K.products(params),
    queryFn:  () => productsApi.getProducts(params).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true, // smooth pagination — old data stays while fetching
  });
}

/** useProduct — full product detail (variants + images) */
export function useProduct(slug) {
  return useQuery({
    queryKey: K.product(slug),
    queryFn:  () => productsApi.getProduct(slug).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled:  !!slug,
  });
}

/** useSearchProducts — keyword search */
export function useSearchProducts(q, params = {}) {
  return useQuery({
    queryKey: K.search(q, params),
    queryFn:  () => productsApi.searchProducts(q, params).then((r) => r.data),
    enabled:  !!q && q.trim().length > 1,
    staleTime: 60 * 1000,
  });
}

/** useCategories — all top-level categories */
export function useCategories() {
  return useQuery({
    queryKey: K.categories(),
    queryFn:  () => productsApi.getCategories().then((r) => r.data),
    staleTime: 10 * 60 * 1000, // categories rarely change
  });
}

/** useCategory — single category with children */
export function useCategory(slug) {
  return useQuery({
    queryKey: K.category(slug),
    queryFn:  () => productsApi.getCategory(slug).then((r) => r.data),
    enabled:  !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────
// ADMIN HOOKS
// ─────────────────────────────────────────────────────────────

/** useCreateProduct — admin: POST /products/ */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useUpdateProduct — admin: PATCH /products/<slug>/ */
export function useUpdateProduct(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.updateProduct(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: K.product(slug) });
      queryClient.invalidateQueries({ queryKey: ["products", "list"] });
      toast.success("Product updated!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useDeleteProduct — admin: DELETE /products/<slug>/ (soft) */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug) => productsApi.deleteProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product removed.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useUploadImage — admin: POST /products/<slug>/images/ (multipart) */
export function useUploadImage(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => productsApi.uploadImage(slug, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: K.product(slug) });
      toast.success("Image uploaded!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useDeleteImage — admin: DELETE /products/<slug>/images/<id>/ */
export function useDeleteImage(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId) => productsApi.deleteImage(slug, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: K.product(slug) });
      toast.success("Image deleted.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useCreateVariant — admin: POST /products/<slug>/variants/ */
export function useCreateVariant(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.createVariant(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: K.product(slug) });
      toast.success("Variant added!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useUpdateVariant — admin: PATCH /products/<slug>/variants/<id>/ */
export function useUpdateVariant(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, data }) =>
      productsApi.updateVariant(slug, variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: K.product(slug) });
      toast.success("Variant updated!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

/** useDeleteVariant — admin: DELETE /products/<slug>/variants/<id>/ */
export function useDeleteVariant(slug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId) => productsApi.deleteVariant(slug, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: K.product(slug) });
      toast.success("Variant removed.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}