"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { useAuth } from "@/context/AuthContext";

export interface AdminBadgeCounts {
  pendingOrders: number;
  pendingReturns: number;
  // pending/processing refunds, plus failed ones not yet retried
  pendingRefunds: number;
}

// Window event that tells the sidebar its counts may be out of date.
// NotificationBell fires it for every live notification, so the sidebar
// reuses the bell's socket instead of opening a second connection; admin
// pages fire it after changing an order or return status.
const BADGES_STALE_EVENT = "admin:badges-stale";

export const refreshAdminBadges = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BADGES_STALE_EVENT));
  }
};

// Collapses a burst of events (e.g. several orders at once) into one request
const DEBOUNCE_MS = 500;

/**
 * Counts of work waiting on staff (pending orders, return requests, refunds)
 * for the admin sidebar badges. No polling: refetches on navigation, when
 * the tab becomes visible again, and on refreshAdminBadges().
 */
export default function useAdminBadgeCounts(): AdminBadgeCounts {
  const axiosSecure = useAxiosSecure();
  const { token } = useAuth();
  const pathname = usePathname();
  const [counts, setCounts] = useState<AdminBadgeCounts>({
    pendingOrders: 0,
    pendingReturns: 0,
    pendingRefunds: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    axiosSecure
      .get<AdminBadgeCounts>("/admin-notifications/badge-counts")
      .then(({ data }) => setCounts(data))
      .catch(() => {});
  }, [axiosSecure, token]);

  const scheduleLoad = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(load, DEBOUNCE_MS);
  }, [load]);

  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleLoad();
    };
    window.addEventListener(BADGES_STALE_EVENT, scheduleLoad);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(BADGES_STALE_EVENT, scheduleLoad);
      document.removeEventListener("visibilitychange", onVisible);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleLoad]);

  return counts;
}
