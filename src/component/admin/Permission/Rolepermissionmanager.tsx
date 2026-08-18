/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ManagedRole =
  | "PRODUCTMANAGER"
  | "ORDERMANAGER"
  | "INVENTORYMANAGER"
  | "SUPPORT";

interface RolePermissionRow {
  id: number;
  role: ManagedRole;
  action: string;
  enabled: boolean;
}

// Keyed as "ACTION:ROLE" for fast lookup
type PermissionMap = Map<string, { id: number; enabled: boolean }>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MANAGED_ROLES: {
  key: ManagedRole;
  label: string;
  color: string;
  activeBg: string;
  dot: string;
  toggleOn: string;
}[] = [
  {
    key: "PRODUCTMANAGER",
    label: "Product Manager",
    color: "text-blue-700",
    activeBg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    toggleOn: "bg-blue-500",
  },
  {
    key: "ORDERMANAGER",
    label: "Order Manager",
    color: "text-emerald-700",
    activeBg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    toggleOn: "bg-emerald-500",
  },
  {
    key: "INVENTORYMANAGER",
    label: "Inventory Manager",
    color: "text-teal-700",
    activeBg: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
    toggleOn: "bg-teal-500",
  },
  {
    key: "SUPPORT",
    label: "Support",
    color: "text-amber-700",
    activeBg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    toggleOn: "bg-amber-500",
  },
];

const MODULE_ICONS: Record<string, React.ReactNode> = {
  Product: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  Order: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Category: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  Cms: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  Blog: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  Courier: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
      <path d="M14 9h4l4 4v4h-8V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  ),
  Barcode: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 5v1M3 10v4M3 19v1M8 5v6M8 16v3M13 5v1M13 10v4M13 19v1M18 5v3M18 13v6M21 5v1M21 10v4M21 19v1" />
    </svg>
  ),
  Location: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Review: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  ),
  Banner: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect width="18" height="12" x="3" y="4" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  ),
  Coupon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  ),
  District: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 3v18h18" />
      <path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-6" />
    </svg>
  ),
  Tag: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  ),
  Analytics: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 3v18h18" />
      <rect width="4" height="7" x="7" y="10" rx="1" />
      <rect width="4" height="12" x="15" y="5" rx="1" />
    </svg>
  ),
  User: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Ticket: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

const DEFAULT_MODULE_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

// Derive module name from action string e.g. "PRODUCT_VIEW" → "Product"
function moduleFromAction(action: string): string {
  const prefix = action.split("_")[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
}

// Nice label from action string e.g. "PRODUCT_VIEW" → "View"
function labelFromAction(action: string): string {
  return action
    .split("_")
    .slice(1)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle component
// ─────────────────────────────────────────────────────────────────────────────
function Toggle({
  enabled,
  colorClass,
  onChange,
}: {
  enabled: boolean;
  colorClass: string;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300 ${
        enabled ? colorClass : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          enabled ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function RolePermissionManager() {
  const axiosSecure = useAxiosSecure();

  // All rows from API: one row per (role, action) pair
  const [rows, setRows] = useState<RolePermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Pending: key = "ACTION:ROLE", value = new enabled state
  const [pending, setPending] = useState<Map<string, boolean>>(new Map());

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [activeRole, setActiveRole] = useState<ManagedRole | "ALL">("ALL");

  // ── Load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // GET /admin/permissions → RolePermissionRow[]
      const res = await axiosSecure.get("/permissions/all");
      const data: RolePermissionRow[] = res.data;
      setRows(data);
      // Auto-expand all modules
      const mods = new Set(data.map((r) => moduleFromAction(r.action)));
      setExpandedModules(mods);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived: unique actions (deduplicated across roles) ─────────────────
  const allActions = Array.from(new Set(rows.map((r) => r.action))).sort();

  // ── Fast lookup: is (action, role) enabled? ─────────────────────────────
  function isEnabled(action: string, role: ManagedRole): boolean {
    const key = `${action}:${role}`;
    if (pending.has(key)) return pending.get(key)!;
    return (
      rows.find((r) => r.action === action && r.role === role)?.enabled ?? false
    );
  }

  // ── Toggle a single cell ─────────────────────────────────────────────────
  function toggle(action: string, role: ManagedRole) {
    const key = `${action}:${role}`;
    const current = isEnabled(action, role);
    setPending((prev) => {
      const next = new Map(prev);
      // If toggling back to the DB value, remove from pending
      const dbValue =
        rows.find((r) => r.action === action && r.role === role)?.enabled ??
        false;
      if (current === dbValue) {
        // We're changing away from DB value
        next.set(key, !current);
      } else {
        // We're reverting back to DB value
        next.delete(key);
      }
      return next;
    });
  }

  // ── Save all pending ────────────────────────────────────────────────────
  async function saveAll() {
    if (!pending.size) return;
    setSaving(true);
    try {
      const payload = Array.from(pending.entries()).map(([key, enabled]) => {
        const [action, role] = key.split(":");
        return { action, role, enabled };
      });
      // PATCH /admin/permissions/bulk → { changes: [{action, role, enabled}] }
      await axiosSecure.patch("/permissions/bulk", { changes: payload });
      // Commit pending into rows
      setRows((prev) =>
        prev.map((r) => {
          const key = `${r.action}:${r.role}`;
          return pending.has(key) ? { ...r, enabled: pending.get(key)! } : r;
        }),
      );
      setPending(new Map());
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  // ── Discard pending ──────────────────────────────────────────────────────
  function discardAll() {
    setPending(new Map());
  }

  // ── Grouped + filtered actions ───────────────────────────────────────────
  const filteredActions = allActions.filter((action) => {
    const matchSearch =
      !search || action.toLowerCase().includes(search.toLowerCase());
    const matchRole = activeRole === "ALL" || isEnabled(action, activeRole);
    return matchSearch && matchRole;
  });

  const grouped = filteredActions.reduce<Record<string, string[]>>(
    (acc, action) => {
      const mod = moduleFromAction(action);
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(action);
      return acc;
    },
    {},
  );

  // ── Stats per role ────────────────────────────────────────────────────────
  const roleStats = MANAGED_ROLES.map((r) => ({
    ...r,
    count: allActions.filter((a) => isEnabled(a, r.key)).length,
  }));

  const pendingCount = pending.size;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Role Permissions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control what each role can do across the admin panel
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                {pendingCount} unsaved change{pendingCount > 1 ? "s" : ""}
              </span>
              <button
                onClick={discardAll}
                className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                Discard
              </button>
            </>
          )}
          <button
            onClick={saveAll}
            disabled={!pendingCount || saving}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              savedFlash
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {saving ? "Saving…" : savedFlash ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* ── Role stat cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {roleStats.map((r) => (
            <button
              key={r.key}
              onClick={() =>
                setActiveRole((prev) => (prev === r.key ? "ALL" : r.key))
              }
              className={`rounded-xl border p-4 text-left transition-all shadow-sm hover:shadow-md ${
                activeRole === r.key
                  ? r.activeBg + " ring-2 ring-offset-1 ring-amber-400"
                  : "bg-white border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    activeRole === r.key ? r.color : "text-slate-400"
                  }`}
                >
                  {r.label}
                </span>
              </div>
              <p
                className={`text-2xl font-bold ${activeRole === r.key ? r.color : "text-slate-700"}`}
              >
                {r.count}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                of {allActions.length} actions enabled
              </p>
            </button>
          ))}
        </div>

        {/* ── Search + toolbar ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions… e.g. PRODUCT, ORDER"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
            />
          </div>
          {activeRole !== "ALL" && (
            <button
              onClick={() => setActiveRole("ALL")}
              className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              ✕ Clear filter
            </button>
          )}
          <button
            onClick={() => setExpandedModules(new Set(Object.keys(grouped)))}
            className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            Expand all
          </button>
          <button
            onClick={() => setExpandedModules(new Set())}
            className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            Collapse all
          </button>
        </div>

        {/* ── Permission matrix ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-20 text-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center text-slate-400 text-sm">
            No actions match your search.
          </div>
        ) : (
          Object.entries(grouped).map(([moduleName, actions]) => (
            <div
              key={moduleName}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              {/* Module header */}
              <button
                onClick={() =>
                  setExpandedModules((prev) => {
                    const next = new Set(prev);
                    next.has(moduleName)
                      ? next.delete(moduleName)
                      : next.add(moduleName);
                    return next;
                  })
                }
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">
                    {MODULE_ICONS[moduleName] ?? "🗂️"}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {moduleName}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {actions.length} action{actions.length > 1 ? "s" : ""}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    expandedModules.has(moduleName) ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Action rows */}
              {expandedModules.has(moduleName) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-t border-slate-50 bg-slate-50/60">
                      <tr>
                        <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[45%]">
                          Action
                        </th>
                        {MANAGED_ROLES.map((r) => (
                          <th
                            key={r.key}
                            className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 min-w-[120px]"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${r.dot}`}
                              />
                              <span>{r.label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {actions.map((action) => {
                        const rowDirty = MANAGED_ROLES.some((r) =>
                          pending.has(`${action}:${r.key}`),
                        );
                        return (
                          <tr
                            key={action}
                            className={`transition-colors ${
                              rowDirty
                                ? "bg-amber-50/60"
                                : "hover:bg-slate-50/80"
                            }`}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                {rowDirty && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                )}
                                <div>
                                  <p className="font-medium text-slate-700 text-[13px] leading-tight">
                                    {labelFromAction(action)}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    {action}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {MANAGED_ROLES.map((r) => (
                              <td key={r.key} className="px-3 py-3 text-center">
                                <div className="flex justify-center">
                                  <Toggle
                                    enabled={isEnabled(action, r.key)}
                                    colorClass={r.toggleOn}
                                    onChange={() => toggle(action, r.key)}
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
