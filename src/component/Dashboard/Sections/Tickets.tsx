"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import useMyTickets from "@/hooks/Tickets/useMyTickets";
import { TicketPriority, TicketStatus } from "@/types/ticket.types";

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-700",
};

const priorityStyles: Record<TicketPriority, string> = {
  LOW: "bg-gray-100 text-gray-500",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-red-50 text-red-600",
};

const Tickets = () => {
  const { tickets, isLoading } = useMyTickets();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">My Support Tickets</h1>
          <p className="text-sm text-gray-500">
            Track and reply to your support requests
          </p>
        </header>

        {/* Tickets */}
        {tickets.length === 0 ? (
          <div className="text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg py-16">
            You have no support tickets yet.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support-tickets/${ticket.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {ticket.message}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${statusStyles[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${priorityStyles[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Created on {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  {ticket.assignedTo?.name && (
                    <span>Assigned to {ticket.assignedTo.name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
