/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api/actions/dashboard.ts
"use server";

import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  conversionRate: number;
  activeUsers: number;
  inventoryAlerts: number;
  newUsers: number;
}

export interface SalesTrendPoint {
  date: string; // "HH:00" for day | weekday for week | "MM-DD" for month/custom
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: number;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  stock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "confirmed";
  payment: string;
}

export interface TopSearchKeyword {
  keyword: string;
  count: number;
}

export interface UserRetentionPoint {
  month: string; // e.g. "Jan 2026"
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
}

export interface TopViewedProduct {
  productId: number;
  title: string;
  category: string;
  views: number;
}

export interface DashboardData {
  stats: DashboardStats;
  salesTrend: SalesTrendPoint[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  topViewedProducts: TopViewedProduct[];
  topSearchKeywords: TopSearchKeyword[];
  userRetention: UserRetentionPoint[];
}

export type DashboardPeriod = "day" | "week" | "month";

// ── Server Action ─────────────────────────────────────────────────────────────

export async function getDashboardData(
  token: string | null,
  options:
    | { period: DashboardPeriod }
    | { start: string; end: string },
): Promise<DashboardData> {
  const queryParams: Record<string, string> =
    "period" in options
      ? { period: options.period }
      : { start: options.start, end: options.end };

  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard`,
      {
        params: queryParams,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    return res.data;
  } catch (error: any) {
    throw new Error(
      `Dashboard fetch failed: ${error?.response?.status || error.message}`,
    );
  }
}
