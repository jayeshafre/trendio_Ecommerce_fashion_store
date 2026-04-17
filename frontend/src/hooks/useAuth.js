/**
 * useAuth — all auth React Query hooks.
 *
 * Exports:
 *   useMe()           → current user query
 *   useLogin()        → email + password login
 *   useRegister()     → new account creation
 *   useLogout()       → invalidate session + clear state
 *   useSendOtp()      → request OTP to phone/email
 *   useVerifyOtp()    → verify OTP (phone/email/login/reset)
 *   useForgotPassword()  → send reset code to email
 *   useResetPassword()   → verify OTP + set new password
 *   useChangePassword()  → change pw for logged-in user
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@api";
import { useAuthStore } from "@store";
import { QUERY_KEYS, ROUTES } from "@constants";
import { getApiError } from "@utils";

// ── useMe ──────────────────────────────────────────────────────────────────────
export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser         = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: async () => {
      const { data } = await authApi.getMe();
      setUser(data);
      return data;
    },
    enabled:   isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry:     false,
  });
}

// ── useLogin ───────────────────────────────────────────────────────────────────
export function useLogin() {
  const navigate  = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser   = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: ({ data }) => {
      setTokens(data.access, data.refresh);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.first_name}!`);
      navigate(ROUTES.HOME);
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useRegister ────────────────────────────────────────────────────────────────
export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (userData) => authApi.register(userData),
    onSuccess: ({ data }) => {
      toast.success("Account created! Please check your email to verify.");
      navigate(ROUTES.LOGIN, { state: { justRegistered: true } });
    },
    onError: (err) => {
      const error = getApiError(err);
      toast.error(error);
    },
  });
}

// ── useLogout ──────────────────────────────────────────────────────────────────
export function useLogout() {
  const navigate      = useNavigate();
  const logout        = useAuthStore((s) => s.logout);
  const refreshToken  = useAuthStore((s) => s.refreshToken);
  const queryClient   = useQueryClient();

  return useMutation({
    mutationFn: () =>
      authApi.logout({ refresh: refreshToken }).catch(() => {}), // silent fail
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success("You've been signed out.");
      navigate(ROUTES.LOGIN);
    },
  });
}

// ── useSendOtp ─────────────────────────────────────────────────────────────────
export function useSendOtp() {
  return useMutation({
    mutationFn: ({ identifier, purpose }) =>
      authApi.sendOtp({ identifier, purpose }),
    onSuccess: () => {
      toast.success("OTP sent! Check your phone or email.");
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useVerifyOtp ───────────────────────────────────────────────────────────────
export function useVerifyOtp({ onSuccess } = {}) {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser   = useAuthStore((s) => s.setUser);
  const navigate  = useNavigate();

  return useMutation({
    mutationFn: ({ identifier, code, purpose }) =>
      authApi.verifyOtp({ identifier, code, purpose }),
    onSuccess: ({ data }, variables) => {
      // OTP login returns tokens
      if (variables.purpose === "otp_login" && data.access) {
        setTokens(data.access, data.refresh);
        setUser(data.user);
        toast.success(`Welcome, ${data.user.first_name}!`);
        navigate(ROUTES.HOME);
      } else {
        toast.success("Verified successfully!");
        onSuccess?.(data, variables);
      }
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useForgotPassword ──────────────────────────────────────────────────────────
export function useForgotPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email }) => authApi.forgotPassword({ email }),
    onSuccess: (_, variables) => {
      navigate("/auth/reset-password", {
        state: { email: variables.email },
      });
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useResetPassword ───────────────────────────────────────────────────────────
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, otp, password, password2 }) =>
      authApi.resetPassword({ email, otp, password, password2 }),
    onSuccess: () => {
      toast.success("Password reset! Please sign in with your new password.");
      navigate(ROUTES.LOGIN);
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// ── useChangePassword ──────────────────────────────────────────────────────────
export function useChangePassword() {
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed. Please sign in again.");
      logout();
      navigate(ROUTES.LOGIN);
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}