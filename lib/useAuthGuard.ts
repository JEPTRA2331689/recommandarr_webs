"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "./store";

/**
 * Redirects to /onboarding if not authenticated.
 * Returns { ready } — true once hydration is complete and auth is confirmed.
 */
export function useAuthGuard(requireAccessKey = false): { ready: boolean } {
  const router = useRouter();
  const { token, accessKey, _hasHydrated } = useAppStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { router.replace("/onboarding"); return; }
    if (requireAccessKey && !accessKey) { router.replace("/onboarding"); return; }
  }, [_hasHydrated, token, accessKey, requireAccessKey, router]);

  const ready = _hasHydrated && !!token && (!requireAccessKey || !!accessKey);
  return { ready };
}
