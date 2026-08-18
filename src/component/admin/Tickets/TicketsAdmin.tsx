"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  MinusCircle,
  AlertCircle,
} from "lucide-react";
import {
  StatCard,
  SearchBar,
  FilterSelect,
  RefreshButton,
  ClearFiltersButton,
  AdminTable,
  MetaPagination,
  PageHeader,
} from "@/component/Shared/Admin/AdminUI/AdminUI";
import useTickets from "@/hooks/Tickets/useTickets";
import { TicketPriority, TicketStatus } from "@/types/ticket.types";

// ── Status config ─────────────────────────────────────────────────────────────
const TICKET_STATUS: Record<
  TicketStatus,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  OPEN: {
    label: "Open",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    icon: <Clock className="w-3 h-3" />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400 animate-pulse",
    icon: <RefreshCw className="w-3 h-3" />,
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  CLOSED: {
    label: "Closed",
    color: "bg-red-50 text-red-700",
    dot: "bg-red-500",
    icon: <XCircle className="w-3 h-3" />,
  },
};

const TICKET_PRIORITY: Record<
  TicketPriority,
  { label: string; color: string; icon: React.ReactNode }
> = {
  LOW: {
    label: "Low",
    color: "bg-gray-100 text-gray-600",
    icon: <MinusCircle className="w-3 h-3" />,
  },
  NORMAL: {
    label: "Normal",
    color: "bg-blue-50 text-blue-700",
    icon: <ArrowUpCircle className="w-3 h-3" />,
  },
  HIGH: {
    label: "High",
    color: "bg-red-50 text-red-700",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

const TICKET_STATUS_OPTIONS = (Object.keys(TICKET_STATUS) as TicketStatus[]).map(
  (s) => ({ label: TICKET_STATUS[s].label, value: s }),
);

const TICKET_PRIORITY_OPTIONS = (
  Object.keys(TICKET_PRIORITY) as TicketPriority[]
).map((p) => ({ label: TICKET_PRIORITY[p].label, value: p }));

const ASSIGNED_FILTER_OPTIONS = [{ label: "Unassigned", value: "unassigned" }];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ── Main Component ─────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function TicketsAdmin() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [assigned, setAssigned] = useState<"unassigned" | "">("");

  const { tickets, isLoading, refetch } = useTickets({
    page,
    limit: LIMIT,
    status: status || undefined,
    priority: priority || undefined,
    unassigned: assigned === "unassigned" || undefined,
    search: search || undefined,
  });

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setAssigned("");
    setPage(1);
  };

  const hasFilters = !!(search || status || priority || assigned);

  const rows = tickets?.data ?? [];
  const meta = tickets?.meta ?? { total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  const openCount = rows.filter((t) => t.status === "OPEN").length;
  const unassignedCount = rows.filter((t) => !t.assignedTo).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Support" title="Tickets" />

      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={meta.total} accent />
          <StatCard
            label="Open (this page)"
            value={openCount}
            sub={`${rows.length} record(s) shown`}
          />
          <StatCard
            label="Unassigned (this page)"
            value={unassignedCount}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Search subject, customer…"
            className="flex-1 min-w-55"
          />
          <FilterSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={TICKET_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          <FilterSelect
            value={priority}
            onChange={(v) => {
              setPriority(v);
              setPage(1);
            }}
            options={TICKET_PRIORITY_OPTIONS}
            placeholder="All Priorities"
          />
          <FilterSelect
            value={assigned}
            onChange={(v) => {
              setAssigned(v as "unassigned" | "");
              setPage(1);
            }}
            options={ASSIGNED_FILTER_OPTIONS}
            placeholder="All Assignees"
          />
          {hasFilters && <ClearFiltersButton onClick={clearFilters} />}
          <RefreshButton onClick={() => refetch()} loading={isLoading} />
        </div>

        <AdminTable
          headers={[
            "Subject",
            "Customer",
            "Priority",
            "Status",
            "Assigned To",
            "Created",
          ]}
          loading={isLoading}
          empty={rows.length === 0}
          emptyAction={
            hasFilters ? (
              <button
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            ) : undefined
          }
        >
          {rows.map((t) => {
            const statusCfg = TICKET_STATUS[t.status];
            const priorityCfg = TICKET_PRIORITY[t.priority];
            return (
              <tr
                key={t.id}
                onClick={() => router.push(`/admin/tickets/${t.id}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-gray-900 leading-tight max-w-xs truncate">
                    {t.subject}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">#{t.id}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {t.user?.name ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.user?.email ?? ""}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${priorityCfg.color}`}
                  >
                    {priorityCfg.icon}
                    {priorityCfg.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs text-gray-600">
                    {t.assignedTo?.name ?? (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </p>
                </td>
                <td className="px-4 py-4 pr-6">
                  <p className="text-xs text-gray-500">{fmtDate(t.createdAt)}</p>
                </td>
              </tr>
            );
          })}
        </AdminTable>

        <MetaPagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          limit={LIMIT}
        />
      </div>
    </div>
  );
}
