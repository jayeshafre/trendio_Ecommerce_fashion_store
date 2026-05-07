/**
 * reviews.api.js — all review HTTP calls
 *
 * GET    /reviews/products/{slug}/          → list reviews + stats
 * POST   /reviews/products/{slug}/          → create review
 * GET    /reviews/products/{slug}/eligible/ → eligibility check
 * PATCH  /reviews/{id}/                     → edit own review
 * DELETE /reviews/{id}/                     → delete own review
 * GET    /reviews/mine/                     → my reviews
 */
import axiosClient from "./axiosClient";

export const reviewsApi = {
  getProductReviews: (slug, params = {}) =>
    axiosClient.get(`/reviews/products/${slug}/`, { params }),

  checkEligibility: (slug) =>
    axiosClient.get(`/reviews/products/${slug}/eligible/`),

  createReview: (slug, data) =>
    axiosClient.post(`/reviews/products/${slug}/`, data),

  updateReview: (id, data) =>
    axiosClient.patch(`/reviews/${id}/`, data),

  deleteReview: (id) =>
    axiosClient.delete(`/reviews/${id}/`),

  getMyReviews: () =>
    axiosClient.get("/reviews/mine/"),
};