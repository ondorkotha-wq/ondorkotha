/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDashboardData,
  type DashboardData,
  type DashboardPeriod,
} from "@/lib/api/actions/dashboard";
import StatsGrid from "./Components/StatsGrid";
import PieceInventoryStatsTiles from "./Components/PieceInventoryStatsTiles";
import StalePieceAlertCard from "./Components/StalePieceAlertCard";
import ReturningAlertCard from "./Components/ReturningAlertCard";
import StockAlertsCard from "./Components/StockAlertsCard";
import SalesChart from "./Components/SalesChart";
import TopProductsTable from "./Components/TopProductsTable";
import RecentOrders from "./Components/RecentOrders";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { Calendar, RefreshCw } from "lucide-react";
import TopViewedProducts from "./Components/TopViewedProducts";
import SearchAnalytics from "./Components/SearchAnalytics";
import UserRetentionChart from "./Components/UserRetentionChart";
import { useAuth } from "@/context/AuthContext";

const toDateInput = (d: Date) => d.toISOString().split("T")[0];

const PERIODS: { label: string; value: DashboardPeriod }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

const TREND_SUBTITLE: Record<DashboardPeriod | "custom", string> = {
  day: "Today by hour",
  week: "Last 7 days",
  month: "Last 30 days",
  custom: "Custom range",
};

// ── Component
export default function DashboardPageComp() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activePeriod, setActivePeriod] = useState<DashboardPeriod | "custom">(
    "month",
  );
  const [customRange, setCustomRange] = useState({
    start: toDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
    end: toDateInput(new Date()),
  });

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const options =
          activePeriod === "custom"
            ? { start: customRange.start, end: customRange.end }
            : { period: activePeriod };

        const currentToken = token || localStorage.getItem("token");
        const result = await getDashboardData(currentToken, options);
        setData(result);
      } catch (err: any) {
        console.error("Dashboard fetch failed:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activePeriod, customRange, token],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePeriodClick = (period: DashboardPeriod) => {
    setActivePeriod(period);
  };

  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    setCustomRange((prev) => ({ ...prev, [field]: value }));
    setActivePeriod("custom");
  };

  // ── Loading ────────────────
  if (loading && !data) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  // ── Error ──────────────────
  if (error && !data) {
    return (
      <FullScreenCenter>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </FullScreenCenter>
    );
  }

  if (!data) return null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen rounded-xl bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your e-commerce performance
            </p>
          </div>

          {/* Date controls */}
          <div className="flex flex-col md:flex-row items-start sm:items-center gap-3">
            {/* Day / Week / Month buttons */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePeriodClick(p.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activePeriod === p.value
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom date pickers */}
            <div
              className={`flex flex-col sm:flex-row w-full items-center gap-2 bg-white border rounded-lg px-3 py-2 transition-colors ${
                activePeriod === "custom"
                  ? "border-gray-900"
                  : "border-gray-200"
              }`}
            >
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <input
                type="date"
                value={customRange.start}
                max={customRange.end}
                onChange={(e) => handleCustomDateChange("start", e.target.value)}
                className="text-sm text-gray-700 bg-transparent border-none outline-none w-32"
              />
              <span className="text-gray-400 text-xs">→</span>
              <input
                type="date"
                value={customRange.end}
                min={customRange.start}
                max={toDateInput(new Date())}
                onChange={(e) => handleCustomDateChange("end", e.target.value)}
                className="text-sm text-gray-700 bg-transparent border-none outline-none w-32"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Stale data overlay */}
        <div
          className={`relative transition-opacity ${refreshing ? "opacity-60 pointer-events-none" : ""}`}
        >
          {/* Stats Grid */}
          <StatsGrid stats={data.stats} />
          <PieceInventoryStatsTiles />
          <StalePieceAlertCard />
          <ReturningAlertCard />
          <StockAlertsCard />

          {/* Charts */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend — takes 2/3 width on large screens */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Sales Trend
                </h2>
                <p className="text-sm text-gray-500">
                  {TREND_SUBTITLE[activePeriod]}
                </p>
              </div>
              <SalesChart data={data.salesTrend} />
            </div>

            {/* Top Viewed Products — 1/3 width */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Most Viewed
                </h2>
                <p className="text-sm text-gray-500">
                  Top products this period
                </p>
              </div>
              <TopViewedProducts data={data.topViewedProducts} />
            </div>
          </div>

          {/* Tables */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">
                  Top Selling Products
                </h2>
                <p className="text-sm text-gray-500">By revenue this period</p>
              </div>
              <TopProductsTable products={data.topProducts} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Orders
                </h2>
                <p className="text-sm text-gray-500">Last 10 orders</p>
              </div>
              <RecentOrders orders={data.recentOrders} />
            </div>
          </div>

          {/* User Retention + Top Searched Keywords */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  User Retention
                </h2>
                <p className="text-sm text-gray-500">
                  New vs. returning customers by month
                </p>
              </div>
              <UserRetentionChart data={data.userRetention} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Top Searched Keywords
                </h2>
                <p className="text-sm text-gray-500">This period</p>
              </div>
              <SearchAnalytics keywords={data.topSearchKeywords} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
