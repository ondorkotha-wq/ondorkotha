"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useFetchInvoiceSettings from "@/hooks/Settings/useFetchInvoiceSettings";
import { InvoicePaperSize } from "@/types/settings";

const PAPER_SIZES: { value: InvoicePaperSize; label: string; hint: string }[] = [
  { value: "A4", label: "A4", hint: "210 × 297 mm — standard office printer paper" },
  { value: "LETTER", label: "Letter", hint: "215.9 × 279.4 mm — US standard" },
  { value: "CUSTOM", label: "Custom", hint: "Set your own width and height" },
];

export default function InvoiceSettingsComp() {
  const axiosSecure = useAxiosSecure();
  const { invoiceSettings, isLoading, refetch } = useFetchInvoiceSettings();

  const [paperSize, setPaperSize] = useState<InvoicePaperSize>("A4");
  const [widthMm, setWidthMm] = useState("");
  const [heightMm, setHeightMm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!invoiceSettings) return;
    setPaperSize(invoiceSettings.invoicePaperSize);
    setWidthMm(invoiceSettings.invoicePaperWidthMm ? String(invoiceSettings.invoicePaperWidthMm) : "");
    setHeightMm(invoiceSettings.invoicePaperHeightMm ? String(invoiceSettings.invoicePaperHeightMm) : "");
  }, [invoiceSettings]);

  const save = async () => {
    if (paperSize === "CUSTOM" && (!widthMm || !heightMm)) {
      return toast.error("Width and height are required for a custom paper size");
    }
    setSaving(true);
    try {
      await axiosSecure.put("/settings/invoice", {
        invoicePaperSize: paperSize,
        invoicePaperWidthMm: paperSize === "CUSTOM" ? Number(widthMm) : null,
        invoicePaperHeightMm: paperSize === "CUSTOM" ? Number(heightMm) : null,
      });
      toast.success("Invoice settings saved");
      refetch();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Invoice Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Controls the paper size used when printing or downloading an invoice.
        </p>
      </div>

      <div className="max-w-150 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {PAPER_SIZES.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPaperSize(opt.value)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  paperSize === opt.value
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.hint}</p>
              </button>
            ))}
          </div>

          {paperSize === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Width (mm)
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={widthMm}
                  onChange={(e) => setWidthMm(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Height (mm)
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={heightMm}
                  onChange={(e) => setHeightMm(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
