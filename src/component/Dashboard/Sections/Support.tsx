/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import toast from "react-hot-toast";
import { TicketPriority } from "@/types/ticket.types";

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low — general question" },
  { value: "NORMAL", label: "Normal — needs a response soon" },
  { value: "HIGH", label: "High — urgent / blocking issue" },
];

const Support = () => {
  const axiosSecure = useAxiosSecure();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("NORMAL");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axiosSecure.post("/support/ticket", {
        subject,
        message,
        priority,
      });

      toast.success("Support request submitted successfully");

      setSubject("");
      setMessage("");
      setPriority("NORMAL");

      if (data?.id) {
        router.push(`/support-tickets/${data.id}`);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to send support request",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-semibold mb-2">Support</h1>
          <p className="text-sm text-gray-500">
            Create a support ticket and our team will get back to you.
          </p>
        </header>

        {/* Support Form */}
        <section className="mb-14">
          <form
            onSubmit={handleSubmit}
            className="border border-gray-200 bg-white rounded-lg p-6 space-y-5"
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Order issue, account problem, etc."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Describe your issue clearly so we can help faster..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-2 rounded-md text-xs font-medium hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Ticket
            </button>
          </form>
        </section>

        {/* Help Center */}
        <section className="text-center">
          <HelpCircle className="w-8 h-8 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 mb-2">Need instant answers?</p>
          <a
            href="/help/help-center"
            className="text-sm font-medium text-gray-900 hover:text-gray-700 transition"
          >
            Visit Help Center →
          </a>
        </section>
      </div>
    </div>
  );
};

export default Support;
