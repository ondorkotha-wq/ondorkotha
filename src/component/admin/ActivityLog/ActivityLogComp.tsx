/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useCallback, useEffect, useState } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { FiRefreshCw } from "react-icons/fi";
import { Search } from "lucide-react";
import LoadingDots from "@/component/Loading/LoadingDS";

// ── Types ──────────────────────────────────────────────────────────────────
type LogModule =
  | "PRODUCT"
  | "ORDER"
  | "USER"
  | "CATALOG"
  | "INVENTORY"
  | "MARKETING"
  | "CONTENT"
  | "SUPPORT"
  | "AUTH"
  | "SYSTEM";

interface ActivityLog {
  id: number;
  action: string;
  module: LogModule;
  severity?: string;
  status?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, any> | null;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  statement: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const MODULE_COLORS: Record<LogModule, string> = {
  PRODUCT: "bg-blue-100 text-blue-700",
  ORDER: "bg-purple-100 text-purple-700",
  USER: "bg-indigo-100 text-indigo-700",
  INVENTORY: "bg-amber-100 text-amber-700",
  CATALOG: "bg-orange-100 text-orange-700",
  MARKETING: "bg-green-100 text-green-700",
  CONTENT: "bg-cyan-100 text-cyan-700",
  SUPPORT: "bg-rose-100 text-rose-700",
  AUTH: "bg-slate-100 text-slate-700",
  SYSTEM: "bg-gray-100 text-gray-700",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-green-600",
  UPDATE: "text-blue-600",
  DELETE: "text-red-600",
  TOGGLE: "text-amber-600",
  LOGIN: "text-indigo-600",
  LOGOUT: "text-slate-500",
  REFUND: "text-purple-600",
  VERIFY: "text-teal-600",
  PRINT: "text-orange-600",
};

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  FAILURE: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const actionColor = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toUpperCase().includes(k),
  );
  return key ? ACTION_COLORS[key] : "text-gray-600";
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MODULES: LogModule[] = [
  "CATALOG",
  "PRODUCT",
  "ORDER",
  "USER",
  "MARKETING",
  "INVENTORY",
  "CONTENT",
  "SUPPORT",
  "AUTH",
  "SYSTEM",
];

const LIMIT = 20;

// ── Component ──────────────────────────────────────────────────────────────
export default function ActivityLogComp() {
  const axiosSecure = useAxiosSecure();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [module, setModule] = useState<LogModule | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  // detail drawer
  const [detail, setDetail] = useState<ActivityLog | null>(null);

  const load = useCallback(
    async (silent = false) => {
      silent ? setIsFetching(true) : setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(LIMIT),
          ...(module && { module }),
          ...(from && { from }),
          ...(to && { to }),
          ...(search && { search }),
        });

        const res = await axiosSecure.get(`/activity-log?${params}`);
        setLogs(res.data.logs ?? []);
        setMeta(res.data.metadata);
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [axiosSecure, page, module, from, to, search],
  );

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = () => {
    setSearch("");
    setModule("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const hasFilters = !!(search || module || from || to);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Activity Log</h1>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={() => load(true)}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: meta.total },
          { label: "This Page", value: logs.length },
          { label: "Module Filter", value: module || "All" },
          { label: "Page", value: `${meta.page} / ${meta.totalPages}` },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-semibold text-gray-800 mt-0.5">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search action, target, admin…"
            className="w-full border border-gray-200 rounded-md px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={14} />
          </div>
        </div>

        <select
          value={module}
          onChange={(e) => {
            setModule(e.target.value as LogModule | "");
            setPage(1);
          }}
          className="border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
        >
          <option value="">All Modules</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Admin</th>
              <th className="py-3 px-4">Module</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Statement</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <LoadingDots />
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-medium">No logs found</p>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 border-t border-gray-200"
                >
                  {/* # */}
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {(meta.page - 1) * LIMIT + i + 1}
                  </td>

                  {/* Admin */}
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">
                      {log.admin.name}
                    </p>
                    <p className="text-xs text-gray-400">{log.admin.role}</p>
                  </td>

                  {/* Module */}
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${MODULE_COLORS[log.module] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {log.module}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-mono font-semibold ${actionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  {/* Statement */}
                  <td className="py-3 px-4 max-w-[260px]">
                    <p
                      className="text-gray-700 text-xs leading-relaxed truncate"
                      title={log.statement}
                    >
                      {log.statement}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {log.status ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[log.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {log.status}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Time */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-xs text-gray-600">
                      {fmtDate(log.createdAt)}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3 px-4 text-right">
                    {(log.oldValue || log.newValue || log.metadata) && (
                      <button
                        onClick={() => setDetail(log)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {(meta.page - 1) * LIMIT + 1} to{" "}
            {Math.min(meta.page * LIMIT, meta.total)} of {meta.total} logs
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                let n: number;
                if (meta.totalPages <= 5) n = i + 1;
                else if (page <= 3) n = i + 1;
                else if (page >= meta.totalPages - 2)
                  n = meta.totalPages - 4 + i;
                else n = page - 2 + i;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-9 h-9 text-sm rounded-md ${page === n ? "bg-blue-600 text-white" : "border border-gray-200 hover:bg-gray-50"}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages}
          </p>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{detail.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtDate(detail.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Statement */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                {detail.statement}
              </p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Admin", value: detail.admin.name },
                { label: "Role", value: detail.admin.role },
                { label: "Module", value: detail.module },
                { label: "Status", value: detail.status ?? "—" },
                { label: "Severity", value: detail.severity ?? "—" },
                { label: "IP", value: detail.ipAddress ?? "—" },
                ...(detail.targetLabel
                  ? [{ label: "Target", value: detail.targetLabel }]
                  : []),
                ...(detail.targetId
                  ? [{ label: "Target ID", value: detail.targetId }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    {label}
                  </p>
                  <p className="text-sm text-gray-800 font-medium mt-0.5 break-all">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Old / New value diff */}
            {(detail.oldValue || detail.newValue) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Changes</p>
                <div className="grid grid-cols-2 gap-3">
                  {detail.oldValue && (
                    <div>
                      <p className="text-[10px] text-red-500 uppercase tracking-wider font-medium mb-1">
                        Before
                      </p>
                      <pre className="bg-red-50 border border-red-100 rounded-lg p-3 text-[11px] text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {detail.newValue && (
                    <div>
                      <p className="text-[10px] text-green-600 uppercase tracking-wider font-medium mb-1">
                        After
                      </p>
                      <pre className="bg-green-50 border border-green-100 rounded-lg p-3 text-[11px] text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User agent */}
            {detail.userAgent && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  User Agent
                </p>
                <p className="text-[11px] text-gray-400 break-all leading-relaxed">
                  {detail.userAgent}
                </p>
              </div>
            )}

            {/* Metadata */}
            {detail.metadata && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Metadata
                </p>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[11px] text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
