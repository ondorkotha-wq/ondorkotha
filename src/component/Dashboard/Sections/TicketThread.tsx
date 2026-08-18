/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, Send, ArrowLeft, MessageCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";
import useMyTicketDetail from "@/hooks/Tickets/useMyTicketDetail";
import useReplyToTicket from "@/hooks/Tickets/useReplyToTicket";
import useFetchCompany from "@/hooks/Company/useFetchCompany";
import { TicketStatus } from "@/types/ticket.types";

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-700",
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const TicketThread = ({ id }: { id: string | number }) => {
  const { ticket, isLoading } = useMyTicketDetail(id);
  const { company } = useFetchCompany();
  const replyMutation = useReplyToTicket();
  const [replyBody, setReplyBody] = useState("");

  const whatsappPhone = (company?.whatsapp ?? "").replace(/\D/g, "");
  const whatsappMessage = ticket
    ? encodeURIComponent(
        `Hi, I have a question about support ticket #${ticket.id}: ${ticket.subject}`,
      )
    : "";

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    replyMutation.mutate(
      { id, body: replyBody.trim() },
      {
        onSuccess: () => {
          toast.success("Reply sent");
          setReplyBody("");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message ?? "Failed to send reply");
        },
      },
    );
  };

  if (isLoading || !ticket) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/support-tickets"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Tickets
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
            <span
              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded ${statusStyles[ticket.status]}`}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Ticket #{ticket.id} · Created{" "}
            {new Date(ticket.createdAt).toLocaleDateString()}
            {ticket.assignedTo?.name && ` · Assigned to ${ticket.assignedTo.name}`}
          </p>
        </header>

        {/* Thread */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4 mb-6">
          {/* Pinned opening message */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-700">You</p>
              <p className="text-xs text-gray-400">
                {fmtDateTime(ticket.createdAt)}
              </p>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {ticket.message}
            </p>
          </div>

          {/* Replies */}
          {ticket.messages.map((m) => {
            const isStaff = m.author?.role && m.author.role !== "CUSTOMER";
            return (
              <div
                key={m.id}
                className={`rounded-lg border p-4 ${
                  isStaff
                    ? "bg-indigo-50 border-indigo-100"
                    : "bg-gray-50 border-gray-200 ml-6"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-700">
                    {isStaff ? (m.author?.name ?? "Support Team") : "You"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {fmtDateTime(m.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {m.body}
                </p>
              </div>
            );
          })}
        </section>

        {/* Composer */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {isClosed ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <Lock className="w-3.5 h-3.5" />
              This ticket is closed. Please open a new ticket if you need
              further help.
            </div>
          ) : (
            <form onSubmit={handleReply} className="space-y-3">
              <label className="block text-xs font-medium text-gray-600">
                Reply
              </label>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                required
                rows={4}
                placeholder="Write your reply…"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
              />
              <button
                type="submit"
                disabled={replyMutation.isPending}
                className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-md text-xs font-medium hover:bg-gray-800 transition disabled:opacity-60"
              >
                {replyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Send Reply
              </button>
            </form>
          )}
        </section>

        {/* WhatsApp CTA */}
        {whatsappPhone && (
          <section className="bg-[#25D366]/5 border border-[#25D366]/30 rounded-lg p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Need faster help?
                </p>
                <p className="text-xs text-gray-500">
                  Chat with us on WhatsApp for a quicker response.
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#25D366] text-white text-xs font-medium rounded-lg hover:bg-[#1ebe5d] transition-colors"
            >
              Chat on WhatsApp
            </a>
          </section>
        )}
      </div>
    </div>
  );
};

export default TicketThread;
