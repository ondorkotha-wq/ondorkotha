/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useMemo, FC } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import {
  Edit3,
  Save,
  Trash2,
  X,
  Plus,
  Bell,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UrgencyBanner {
  id: number;
  message: string;
  eventType: string | null;
  link: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

interface BannerFormData {
  message: string;
  eventType: string;
  link: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: BannerFormData = {
  message: "",
  eventType: "",
  link: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const inputCls = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white ${
    error ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

const toLocalDate = (iso: string) => {
  if (!iso) return "";
  return iso.slice(0, 10);
};

function getBannerStatus(banner: UrgencyBanner): {
  label: string;
  color: string;
  dot: string;
} {
  if (!banner.isActive)
    return { label: "Inactive", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  const now = Date.now();
  const start = new Date(banner.startDate).getTime();
  const end = new Date(banner.endDate).getTime();
  if (now < start)
    return { label: "Scheduled", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" };
  if (now > end)
    return { label: "Expired", color: "bg-red-100 text-red-600", dot: "bg-red-400" };
  return { label: "Live", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const UrgencyBannerManagement: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const { data: items = [], isLoading, refetch } = useQuery<UrgencyBanner[]>({
    queryKey: ["urgency-banners-admin"],
    queryFn: async () => {
      const res = await axiosSecure.get("/urgency-banners");
      return res.data;
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.message.trim()) errors.message = "Message is required";
    else if (formData.message.trim().length > 500) errors.message = "Max 500 characters";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate)
      errors.endDate = "End date must be after start date";
    if (
      formData.link?.trim() &&
      !formData.link.trim().startsWith("/") &&
      !formData.link.trim().startsWith("http")
    )
      errors.link = "Must start with / or http";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const isFormValid = useMemo(
    () => !!formData.message.trim() && !!formData.startDate && !!formData.endDate,
    [formData.message, formData.startDate, formData.endDate],
  );

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setValidationErrors({});
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof BannerFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const handleEdit = useCallback((banner: UrgencyBanner) => {
    setEditingId(banner.id);
    setIsAdding(false);
    setFormData({
      message: banner.message,
      eventType: banner.eventType ?? "",
      link: banner.link ?? "",
      startDate: toLocalDate(banner.startDate),
      endDate: toLocalDate(banner.endDate),
      isActive: banner.isActive,
    });
    setValidationErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  }, [resetForm]);

  const handleAddNew = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  }, [resetForm]);

  const saveItem = useCallback(
    async (id?: number) => {
      if (!validateForm()) {
        toast.error("Please fix the errors before saving");
        return;
      }
      setIsSaving(true);
      try {
        const payload = {
          message: formData.message.trim(),
          eventType: formData.eventType.trim() || null,
          link: formData.link.trim() || null,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          isActive: formData.isActive,
        };

        if (id !== undefined) {
          await axiosSecure.patch(`/urgency-banners/${id}`, payload);
          toast.success("Banner updated");
          setEditingId(null);
        } else {
          await axiosSecure.post("/urgency-banners", payload);
          toast.success("Banner created");
          setIsAdding(false);
        }

        resetForm();
        await refetch();
      } catch (error: any) {
        const apiError = error as ApiError;
        toast.error(apiError?.response?.data?.message ?? "Operation failed");
      } finally {
        setIsSaving(false);
      }
    },
    [axiosSecure, formData, refetch, resetForm, validateForm],
  );

  const toggleActive = useCallback(
    async (banner: UrgencyBanner) => {
      try {
        await axiosSecure.patch(`/urgency-banners/${banner.id}`, {
          isActive: !banner.isActive,
        });
        toast.success(`Banner is now ${!banner.isActive ? "active" : "inactive"}`);
        await refetch();
      } catch {
        toast.error("Failed to toggle status");
      }
    },
    [axiosSecure, refetch],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/urgency-banners/${deleteId}`);
      toast.success("Banner deleted");
      setDeleteId(null);
      await refetch();
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message ?? "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch]);

  if (isLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  const isBusy = editingId !== null || isAdding;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell size={20} className="text-amber-500" />
            Urgency Banners
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Time-sensitive banners shown on the homepage — active only within the set date range
          </p>
        </div>
        {!isAdding && (
          <button
            disabled={isBusy}
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add banner
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Message", "Event Type", "Date Range", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap last:text-right"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isAdding && (
              <EditRow
                formData={formData}
                errors={validationErrors}
                isSaving={isSaving}
                isFormValid={isFormValid}
                onFieldChange={handleFieldChange}
                onSave={() => saveItem()}
                onCancel={handleCancel}
              />
            )}

            {items.map((banner) =>
              editingId === banner.id ? (
                <EditRow
                  key={banner.id}
                  formData={formData}
                  errors={validationErrors}
                  isSaving={isSaving}
                  isFormValid={isFormValid}
                  onFieldChange={handleFieldChange}
                  onSave={() => saveItem(banner.id)}
                  onCancel={handleCancel}
                />
              ) : (
                <ViewRow
                  key={banner.id}
                  banner={banner}
                  disabled={isBusy}
                  onEdit={() => handleEdit(banner)}
                  onDelete={() => setDeleteId(banner.id)}
                  onToggle={() => toggleActive(banner)}
                />
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {items.length === 0 && !isAdding && (
        <div className="text-center py-14">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No urgency banners yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a banner to show time-sensitive messages on the homepage
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Add banner
          </button>
        </div>
      )}

      {deleteId !== null && (
        <DeleteConfirmationModal
          open={!!deleteId}
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ViewRowProps {
  banner: UrgencyBanner;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

const ViewRow: FC<ViewRowProps> = ({ banner, disabled, onEdit, onDelete, onToggle }) => {
  const status = getBannerStatus(banner);
  const fmt = (d: string) => new Date(d).toLocaleDateString();

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-5 py-4 align-middle">
        <p className="font-medium text-sm text-gray-900 max-w-[260px] truncate">
          {banner.message}
        </p>
        {banner.link && (
          <p className="text-xs text-indigo-500 font-mono mt-0.5 truncate max-w-[260px]">
            {banner.link}
          </p>
        )}
      </td>

      <td className="px-5 py-4 align-middle">
        <span className="text-sm text-gray-600">{banner.eventType ?? "—"}</span>
      </td>

      <td className="px-5 py-4 align-middle whitespace-nowrap">
        <span className="text-xs text-gray-600">
          {fmt(banner.startDate)} → {fmt(banner.endDate)}
        </span>
      </td>

      <td className="px-5 py-4 align-middle">
        <button
          onClick={onToggle}
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${status.color}`}
          title="Click to toggle active"
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`} />
          {status.label}
        </button>
      </td>

      <td className="px-5 py-4 align-middle">
        <div className="flex justify-end gap-1">
          <button
            onClick={onEdit}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
            title="Edit"
          >
            <Edit3 size={17} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
};

interface EditRowProps {
  formData: BannerFormData;
  errors: Record<string, string>;
  isSaving: boolean;
  isFormValid: boolean;
  onFieldChange: (field: keyof BannerFormData, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditRow: FC<EditRowProps> = ({
  formData,
  errors,
  isSaving,
  isFormValid,
  onFieldChange,
  onSave,
  onCancel,
}) => (
  <tr className="bg-amber-50/40">
    {/* Message */}
    <td className="px-5 py-4 align-top">
      <div className="min-w-[220px]">
        <textarea
          placeholder="Banner message *"
          value={formData.message}
          onChange={(e) => onFieldChange("message", e.target.value)}
          rows={2}
          className={`${inputCls(errors.message)} resize-none`}
        />
        {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
        <div className="relative mt-1.5">
          <LinkIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Link (optional)"
            value={formData.link}
            onChange={(e) => onFieldChange("link", e.target.value)}
            className={`${inputCls(errors.link)} pl-7 font-mono text-xs`}
          />
        </div>
        {errors.link && <p className="text-xs text-red-600 mt-1">{errors.link}</p>}
      </div>
    </td>

    {/* Event type */}
    <td className="px-5 py-4 align-top">
      <div className="min-w-[120px]">
        <input
          type="text"
          placeholder="e.g. Eid, Boisakh"
          value={formData.eventType}
          onChange={(e) => onFieldChange("eventType", e.target.value)}
          className={inputCls()}
        />
      </div>
    </td>

    {/* Date range */}
    <td className="px-5 py-4 align-top">
      <div className="min-w-[200px] space-y-1.5">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide">Start *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => onFieldChange("startDate", e.target.value)}
            className={inputCls(errors.startDate)}
          />
          {errors.startDate && <p className="text-xs text-red-600 mt-0.5">{errors.startDate}</p>}
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wide">End *</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => onFieldChange("endDate", e.target.value)}
            className={inputCls(errors.endDate)}
          />
          {errors.endDate && <p className="text-xs text-red-600 mt-0.5">{errors.endDate}</p>}
        </div>
      </div>
    </td>

    {/* Status */}
    <td className="px-5 py-4 align-top">
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => onFieldChange("isActive", e.target.checked)}
          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
          {formData.isActive ? "Active" : "Inactive"}
        </span>
      </label>
    </td>

    {/* Actions */}
    <td className="px-5 py-4 align-top">
      <div className="flex justify-end gap-2">
        <button
          onClick={onSave}
          disabled={!isFormValid || isSaving}
          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save"
        >
          <Save size={18} />
        </button>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          title="Cancel"
        >
          <X size={18} />
        </button>
      </div>
    </td>
  </tr>
);

export default UrgencyBannerManagement;
