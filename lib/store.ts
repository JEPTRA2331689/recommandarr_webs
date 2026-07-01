"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  token: string | null;
  accessKey: string | null;
  _hasHydrated: boolean;
  setToken: (token: string) => void;
  setAccessKey: (key: string) => void;
  clearToken: () => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      accessKey: null,
      _hasHydrated: false,
      setToken: (token) => set({ token }),
      setAccessKey: (accessKey) => set({ accessKey }),
      clearToken: () => set({ token: null }),
      logout: () => set({ token: null, accessKey: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "swipefilm-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
