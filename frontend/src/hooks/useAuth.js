import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@api";
import { useAuthStore } from "@store";
import { QUERY_KEYS, ROUTES } from "@constants";
import { getApiError } from "@utils";

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn:  async () => {
      const { data } = await authApi.getMe();
      setUser(data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const navigate   = useNavigate();
  const setTokens  = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      setTokens(data.access, data.refresh);
      toast.success("Welcome back!");
      navigate(ROUTES.HOME);
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}

export function useLogout() {
  const navigate     = useNavigate();
  const logout       = useAuthStore((s) => s.logout);
  const queryClient  = useQueryClient();
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useMutation({
    mutationFn: () => authApi.logout({ refresh: refreshToken }),
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate(ROUTES.LOGIN);
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Account created! Please log in.");
      navigate(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(getApiError(err)),
  });
}
