"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { EmailTemplate } from "@/types/email-template";
import axios from "axios";

type View = "list" | "edit";

// Reference only — shown next to the editor so admins know which
// {{placeholders}} this template's send call actually provides.
const TEMPLATE_VARIABLES: Record<string, string[]> = {
  "order-confirmation": [
    "customerName",
    "orderId",
    "trackingToken",
    "shippingAddress",
    "districtName",
    "postCode",
    "items (productTitle, size, color, quantity, priceAtPurchase)",
    "subtotal",
    "deliveryCharge",
    "total",
  ],
  "order-status-update": ["customerName", "orderId", "status", "trackingToken"],
  "refund-update": ["customerName", "orderId", "amount"],
  "return-request-submitted": ["customerName", "orderId"],
  "return-request-approved": ["customerName", "orderId"],
  "return-request-rejected": ["customerName", "orderId"],
  "return-request-item-received": ["customerName", "orderId"],
  "ticket-reply": [
    "customerName",
    "ticketId",
    "subject",
    "replyPreview",
    "ticketUrl",
  ],
  offer: ["customerName", "heading", "message", "ctaLabel", "ctaUrl"],
  "low-stock-alert": [
    "outOfStock (productTitle, sku, size, color, quantity, lowStockAt)",
    "lowStock (same fields)",
    "generatedAt",
    "dashboardUrl",
  ],
  "stale-pieces-alert": [
    "items (productTitle, color, size, batchId, pending, quantity, ageDays)",
    "thresholdDays",
    "generatedAt",
    "dashboardUrl",
  ],
  "pick-slip": ["orderId", "lines (barcodeValue, productTitle, color, size, locationCode)"],
};

export default function EmailTemplatesAdmin() {
  const axiosSecure = useAxiosSecure();

  const [view, setView] = useState<View>("list");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosSecure.get<EmailTemplate[]>(
        "/email-templates",
      );
      setTemplates(data);
    } catch {
      toast.error("Failed to load email templates");
    } finally {
      setIsLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setSubject(template.subject);
    setBody(template.body);
    setView("edit");
  };

  const backToList = () => {
    setView("list");
    setEditing(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!subject.trim()) return toast.error("Subject is required");
    if (!body.trim()) return toast.error("Body is required");

    setIsSaving(true);
    try {
      await axiosSecure.patch(`/email-templates/${editing.key}`, {
        subject,
        body,
      });
      toast.success("Template saved");
      backToList();
      fetchTemplates();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      toast.error(msg ?? "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (view === "edit" && editing) {
    const variables = TEMPLATE_VARIABLES[editing.key] ?? [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={backToList}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {editing.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">
              {editing.key}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
              {editing.key === "offer" && (
                <p className="text-xs text-amber-600 mt-1.5">
                  This template is sent with a subject chosen at send time
                  (e.g. from the marketing tool that triggers it) — this field
                  is a reference default only and won&apos;t be used.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Body (HTML)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={22}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400 resize-y"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Save size={16} />
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Available placeholders
            </h3>
            {variables.length === 0 ? (
              <p className="text-sm text-gray-400">None</p>
            ) : (
              <ul className="space-y-2">
                {variables.map((v) => (
                  <li key={v} className="text-sm text-gray-600 font-mono">
                    {v}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Use double curly braces, e.g. {"{{orderId}}"}, in both the
              subject and body.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Email Templates
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Edit the subject and body of transactional emails sent by the
          system
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : templates.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-500">
            No templates found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => (
              <div
                key={template.key}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">
                    {template.key}
                  </p>
                </div>
                <p className="text-sm text-gray-500 truncate max-w-xs hidden md:block">
                  {template.subject}
                </p>
                <button
                  onClick={() => openEdit(template)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shrink-0"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
