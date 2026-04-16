import axiosClient from "./axiosClient";

export const productsApi = {
  getAll:     (params) => axiosClient.get("/products/", { params }),
  getBySlug:  (slug)   => axiosClient.get(`/products/${slug}/`),
  getCategories: ()    => axiosClient.get("/products/categories/"),
  search:     (q)      => axiosClient.get("/products/search/", { params: { q } }),

  // Admin only
  create:     (data)   => axiosClient.post("/products/", data),
  update:     (id, data) => axiosClient.patch(`/products/${id}/`, data),
  delete:     (id)     => axiosClient.delete(`/products/${id}/`),
};
