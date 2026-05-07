/**
 * useReviews.js — React Query hooks for reviews
 *
 * Exports:
 *   useProductReviews(slug, params) → paginated reviews + stats
 *   useReviewEligibility(slug)      → can current user review?
 *   useCreateReview()               → POST create
 *   useUpdateReview()               → PATCH edit own
 *   useDeleteReview()               → DELETE own
 *   useMyReviews()                  → GET all my reviews
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { reviewsApi } from "@api/reviews.api";
import { getApiError } from "@utils";

const REVIEWS_KEY = (slug) => ["reviews", slug];

// ── Product reviews (public) ──────────────────────────────────
export function useProductReviews(slug, params = {}) {
  return useQuery({
    queryKey: [...REVIEWS_KEY(slug), params],
    queryFn: async () => {
      const { data } = await reviewsApi.getProductReviews(slug, params);
      return data;
    },
    enabled:   !!slug,
    staleTime: 60 * 1000,
  });
}

// ── Eligibility check (auth only) ─────────────────────────────
export function useReviewEligibility(slug, enabled = true) {
  return useQuery({
    queryKey: ["review-eligible", slug],
    queryFn: async () => {
      const { data } = await reviewsApi.checkEligibility(slug);
      return data;
    },
    enabled:   !!slug && enabled,
    staleTime: 2 * 60 * 1000,
    retry:     false,
  });
}

// ── Create review ─────────────────────────────────────────────
export function useCreateReview(slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => reviewsApi.createReview(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REVIEWS_KEY(slug) });
      qc.invalidateQueries({ queryKey: ["review-eligible", slug] });
      toast.success("Review submitted!");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── Update review ─────────────────────────────────────────────
export function useUpdateReview(slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => reviewsApi.updateReview(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REVIEWS_KEY(slug) });
      qc.invalidateQueries({ queryKey: ["review-eligible", slug] });
      toast.success("Review updated.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── Delete review ─────────────────────────────────────────────
export function useDeleteReview(slug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REVIEWS_KEY(slug) });
      qc.invalidateQueries({ queryKey: ["review-eligible", slug] });
      toast.success("Review deleted.");
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

// ── My reviews ────────────────────────────────────────────────
export function useMyReviews() {
  return useQuery({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const { data } = await reviewsApi.getMyReviews();
      return data;
    },
    staleTime: 60 * 1000,
  });
}