/**
 * Auth global state — persisted to localStorage via Zustand.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@constants";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: "trendio-auth",
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
