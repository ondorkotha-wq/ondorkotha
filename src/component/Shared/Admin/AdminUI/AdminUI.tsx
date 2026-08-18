/**
 * shared/AdminUI.tsx
 * Reusable primitives extracted from ActivityLog + used by AllOrders.
 * Import individually — no barrel export to keep tree-shaking clean.
 */

"use client";

import React, { ReactNode } from "react";
import { Search, RefreshCw, X, Star } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
/**
 * A tiny pill badge. Pass `colorClass` like "bg-blue-50 text-blue-700".
 */
export function Badge({
  label,
  onRemove,
  colorClass = "bg-gray-100 text-gray-600",
  dot,
  icon,
  removable = false,
}: {
  label: string;
  onRemove?: () => void;
  colorClass?: string;
  dot?: string; // tailwind bg color e.g. "bg-blue-500"
  icon?: React.ReactNode; // For custom icons
  removable?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
        removable ? "pr-1" : ""
      } ${colorClass}`}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      <span>{label}</span>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove filter"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        accent ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-200"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
          accent ? "text-indigo-100" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-semibold leading-none ${
          accent ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs mt-1.5 ${accent ? "text-indigo-100" : "text-gray-400"}`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ── SearchBar ─────────────────────────────────────────────────────────────────
export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 text-gray-700 placeholder:text-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── FilterSelect ──────────────────────────────────────────────────────────────
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "All",
  className = "",
}: {
  value: T | "";
  onChange: (v: T | "") => void;
  options: { label: string; value: T }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
      className={`py-2.5 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 text-gray-700 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── DateRangePicker ───────────────────────────────────────────────────────────
export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <>
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="py-2.5 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 text-gray-600"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="py-2.5 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 text-gray-600"
      />
    </>
  );
}

// ── RefreshButton ─────────────────────────────────────────────────────────────
export function RefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      title="Refresh"
    >
      <RefreshCw
        className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
      />
    </button>
  );
}

// ── ClearFiltersButton ────────────────────────────────────────────────────────
export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
    >
      Clear
    </button>
  );
}

// ── Table shell ───────────────────────────────────────────────────────────────
export function AdminTable({
  headers,
  children,
  loading,
  empty,
  emptyAction,
}: {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyAction?: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 first:pl-6 last:pr-6"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="py-20 text-center text-sm text-gray-400">
                Loading…
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="py-20 text-center text-sm text-gray-500"
              >
                <div className="flex flex-col items-center gap-3">
                  <p>No records found</p>
                  {emptyAction}
                </div>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function MetaPagination({
  meta,
  page,
  onPageChange,
  limit,
}: {
  meta: Meta;
  page: number;
  onPageChange: (p: number) => void;
  limit: number;
}) {
  if (meta.totalPages <= 1) return null;

  const pages = buildPageNumbers(page, meta.totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-3 rounded-xl border border-gray-200">
      <p className="text-xs text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-700">
          {(meta.page - 1) * limit + 1}–
          {Math.min(meta.page * limit, meta.total)}
        </span>{" "}
        of <span className="font-medium text-gray-700">{meta.total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <PageBtn
          label="←"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-sm">
              …
            </span>
          ) : (
            <PageBtn
              key={p}
              label={String(p)}
              active={p === page}
              onClick={() => onPageChange(p as number)}
            />
          ),
        )}
        <PageBtn
          label="→"
          disabled={page >= meta.totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>

      <p className="text-xs text-gray-500">
        Page <span className="font-medium text-gray-700">{meta.page}</span> /{" "}
        {meta.totalPages}
      </p>
    </div>
  );
}

function PageBtn({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-8 h-8 px-2 text-xs rounded-lg transition-colors font-medium ${
        active
          ? "bg-indigo-600 text-white"
          : disabled
            ? "text-gray-300 cursor-not-allowed"
            : "border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  headerActions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white h-full flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            {subtitle && (
              <p className="text-xs text-gray-400 mb-0.5">{subtitle}</p>
            )}
            <p className="text-base font-semibold text-gray-900 leading-tight">
              {title}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {headerActions}

            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
      </div>
    </div>
  );
}

// ── DrawerSection ─────────────────────────────────────────────────────────────
export function DrawerSection({
  title,
  children,
  tint = "slate",
}: {
  title: string;
  children: React.ReactNode;
  tint?: "slate" | "blue" | "green" | "red" | "amber";
}) {
  const tints: Record<string, string> = {
    slate: "bg-gray-50 border-gray-100",
    blue: "bg-blue-50 border-blue-100",
    green: "bg-emerald-50 border-emerald-100",
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${tints[tint]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── DrawerRow ─────────────────────────────────────────────────────────────────
export function DrawerRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span
        className={`text-xs text-right break-all ${
          mono ? "font-mono" : "font-medium"
        } ${highlight ? "text-emerald-700 font-semibold" : "text-gray-800"}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── JsonBlock ─────────────────────────────────────────────────────────────────
export function JsonBlock({
  label,
  data,
  tint = "slate",
}: {
  label?: string;
  data: object;
  tint?: "slate" | "green" | "red";
}) {
  const tints: Record<string, string> = {
    slate: "bg-gray-50 border-gray-200 text-gray-700",
    green: "bg-emerald-50 border-emerald-100 text-gray-700",
    red: "bg-red-50 border-red-100 text-gray-700",
  };
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          {label}
        </p>
      )}
      <pre
        className={`rounded-lg border px-4 py-3 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed ${tints[tint]}`}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs text-gray-400 mb-0.5">{eyebrow}</p>
        )}
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

// SearchInput Component
export const SearchInput = ({
  placeholder,
  value,
  onChange,
  className = "",
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 ${className}`}
  />
);

// FilterDropdown Component
export const FilterDropdown = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// StarRating Component
export const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3 h-3 ${
          star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

// Pagination Component
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex gap-2">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
    >
      Prev
    </button>
    <span className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50">
      {currentPage} / {totalPages}
    </span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
    >
      Next
    </button>
  </div>
);
