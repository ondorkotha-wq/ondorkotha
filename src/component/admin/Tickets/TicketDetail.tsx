/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  Lock,
  User,
} from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useTicketDetail from "@/hooks/Tickets/useTicketDetail";
import useAssignableStaff from "@/hooks/Tickets/useAssignableStaff";
import { TicketPriority, TicketStatus } from "@/types/ticket.types";
import { useHasPermission } from "@/context/PermissionsContext";

// ── Status / priority config (mirrors TicketsAdmin.tsx) ────────────────────────
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

const TICKET_PRIORITY: Record<TicketPriority, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-600" },
  NORMAL: { label: "Normal", color: "bg-blue-50 text-blue-700" },
  HIGH: { label: "High", color: "bg-red-50 text-red-700" },
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TicketDetail({ id }: { id: number | string }) {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  const { ticket, isLoading } = useTicketDetail(id);
  const { staff } = useAssignableStaff();
  const canReply = useHasPermission("TICKET_REPLY");
  const canAssign = useHasPermission("TICKET_ASSIGN");
  const canManage = useHasPermission("TICKET_MANAGE");

  const [replyBody, setReplyBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
  };

  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosSecure.post(`/admin/tickets/${id}/reply`, {
        body: replyBody.trim(),
        isInternalNote,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(isInternalNote ? "Internal note added" : "Reply sent");
      setReplyBody("");
      setIsInternalNote(false);
      invalidate();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to send reply");
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (assignedToId: number) => {
      const res = await axiosSecure.patch(`/admin/tickets/${id}/assign`, {
        assignedToId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ticket assigned");
      invalidate();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to assign ticket");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: TicketStatus) => {
      const res = await axiosSecure.patch(`/admin/tickets/${id}/status`, {
        status,
      });
      return res.data;
    },
    onSuccess: (_data, status) => {
      toast.success(`Ticket marked ${TICKET_STATUS[status].label}`);
      invalidate();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to update status");
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async (priority: TicketPriority) => {
      const res = await axiosSecure.patch(`/admin/tickets/${id}/priority`, {
        priority,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Priority updated");
      invalidate();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? "Failed to update priority");
    },
  });

  const handleReplySubmit = () => {
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    replyMutation.mutate();
  };

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/tickets")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tickets
        </button>
        <div className="py-24 text-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  const statusCfg = TICKET_STATUS[ticket.status];
  const priorityCfg = TICKET_PRIORITY[ticket.priority];

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/admin/tickets")}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Tickets
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Ticket #{ticket.id}</p>
            <h1 className="text-lg font-semibold text-gray-900">
              {ticket.subject}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {ticket.user?.name ?? "—"}
              {ticket.user?.email ? ` · ${ticket.user.email}` : ""}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Created {fmtDateTime(ticket.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${priorityCfg.color}`}
            >
              {priorityCfg.label} Priority
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          </div>
        </div>

        {(canAssign || canManage) && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
            {/* Assign dropdown */}
            {canAssign && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val) assignMutation.mutate(val);
                  }}
                  disabled={assignMutation.isPending}
                  className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-gray-700"
                >
                  <option value="">
                    {ticket.assignedTo?.name
                      ? `Assigned: ${ticket.assignedTo.name}`
                      : "Assign to…"}
                  </option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name ?? s.email} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority dropdown */}
            {canManage && (
              <select
                value={ticket.priority}
                onChange={(e) =>
                  priorityMutation.mutate(e.target.value as TicketPriority)
                }
                disabled={priorityMutation.isPending}
                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400 text-gray-700"
              >
                {(Object.keys(TICKET_PRIORITY) as TicketPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {TICKET_PRIORITY[p].label} Priority
                  </option>
                ))}
              </select>
            )}

            {/* Explicit status action buttons */}
            {canManage && (
              <div className="flex items-center gap-2 ml-auto">
                {ticket.status === "OPEN" && (
                  <button
                    onClick={() => statusMutation.mutate("IN_PROGRESS")}
                    disabled={statusMutation.isPending}
                    className="px-3 py-2 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    Mark In Progress
                  </button>
                )}
                {(ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") && (
                  <button
                    onClick={() => statusMutation.mutate("RESOLVED")}
                    disabled={statusMutation.isPending}
                    className="px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                {ticket.status !== "CLOSED" && (
                  <button
                    onClick={() => statusMutation.mutate("CLOSED")}
                    disabled={statusMutation.isPending}
                    className="px-3 py-2 text-xs font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    Close Ticket
                  </button>
                )}
                {ticket.status === "CLOSED" && (
                  <button
                    onClick={() => statusMutation.mutate("OPEN")}
                    disabled={statusMutation.isPending}
                    className="px-3 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Conversation
          </p>
        </div>

        <div className="max-h-128 overflow-y-auto p-6 space-y-4">
          {/* Pinned opening message */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-700">
                {ticket.user?.name ?? "Customer"}
              </p>
              <p className="text-xs text-gray-400">
                {fmtDateTime(ticket.createdAt)}
              </p>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {ticket.message}
            </p>
          </div>

          {/* Replies */}
          {ticket.messages.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              No replies yet.
            </p>
          ) : (
            ticket.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border p-4 ${
                  m.isInternalNote
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-700">
                      {m.author?.name ?? "—"}
                    </p>
                    {m.author?.role && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {m.author.role}
                      </span>
                    )}
                    {m.isInternalNote && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                        <Lock className="w-2.5 h-2.5" />
                        Internal note
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {fmtDateTime(m.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {m.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        {canReply && (
        <div className="border-t border-gray-100 p-4 space-y-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder={
              isInternalNote
                ? "Write an internal note (not visible to the customer)…"
                : "Write a reply to the customer…"
            }
            rows={3}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none resize-none ${
              isInternalNote
                ? "border-amber-200 bg-amber-50 focus:border-amber-400"
                : "border-gray-200 focus:border-indigo-400"
            }`}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternalNote}
                onChange={(e) => setIsInternalNote(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              Internal note (not visible to customer)
            </label>
            <button
              onClick={handleReplySubmit}
              disabled={replyMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                isInternalNote
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {replyMutation.isPending
                ? "Sending…"
                : isInternalNote
                  ? "Add Note"
                  : "Send Reply"}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
