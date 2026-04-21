/**
 * useAuth.js — all auth React Query hooks.
 *
 * Import from "@hooks/useAuth":
 *   useMe, useLogin, useRegister, useLogout,
 *   useSendOtp, useVerifyOtp,
 *   useForgotPassword, useResetPassword, useChangePassword
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@api";
import { useAuthStore } from "@store";
import { QUERY_KEYS, ROUTES } from "@constants";
import { getApiError } from "@utils";

// useMe
export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: async () => {
      const { data } = await authApi.getMe();
      setUser(data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// useLogin
export function useLogin() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: ({ data }) => {
      setTokens(data.access, data.refresh);
      setUser(data.user);
      toast.success("Welcome back, " + data.user.first_name + "!");
      navigate(ROUTES.HOME);
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// useRegister
export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (userData) => authApi.register(userData),
    onSuccess: () => {
      toast.success("Account created! Please sign in.");
      navigate(ROUTES.LOGIN, { state: { justRegistered: true } });
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// useLogout
export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout({ refresh: refreshToken }).catch(() => {}),
    onSettled: () => {
      logout();
      queryClient.clear();
      toast.success("You've been signed out.");
      navigate(ROUTES.LOGIN);
    },
  });
}

// useSendOtp
// Caller MUST pass onSuccess/onError in mutate() second arg to handle UI
// sendOtp.mutate({ identifier, purpose }, { onSuccess: () => {}, onError: () => {} })
export function useSendOtp() {
  return useMutation({
    mutationFn: ({ identifier, purpose }) =>
      authApi.sendOtp({ identifier, purpose }),
  });
}

// useVerifyOtp
// For otp_login: auto logs in. For phone/email verify: caller handles via mutate onSuccess
// verifyOtp.mutate({ identifier, code, purpose }, { onSuccess: () => {}, onError: () => {} })
export function useVerifyOtp() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ identifier, code, purpose }) =>
      authApi.verifyOtp({ identifier, code, purpose }),
    onSuccess: ({ data }, variables) => {
      if (variables.purpose === "otp_login" && data.access) {
        setTokens(data.access, data.refresh);
        setUser(data.user);
        toast.success("Welcome, " + data.user.first_name + "!");
        navigate(ROUTES.HOME);
      }
      // all other purposes: caller handles onSuccess
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// useForgotPassword
export function useForgotPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ email }) => authApi.forgotPassword({ email }),
    onSuccess: (_, variables) => {
      toast.success("Recovery code sent! Check your email.");
      navigate("/auth/reset-password", { state: { email: variables.email } });
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// useResetPassword
export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ email, otp, password, password2 }) =>
      authApi.resetPassword({ email, otp, password, password2 }),
    onSuccess: () => {
      toast.success("Password reset! Please sign in.");
      navigate(ROUTES.LOGIN);
    },
    onError: (err) => {
      toast.error(getApiError(err));
    },
  });
}

// useChangePassword
export function useChangePassword() {
  const logout = useAuthStore((s) => s.logout);
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