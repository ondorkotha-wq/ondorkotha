/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useMemo, FC } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import {
  Edit3,
  Save,
  Trash2,
  X,
  Plus,
  Upload,
  ExternalLink,
  Megaphone,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";
import useFetchBroadBanners from "@/hooks/Homepage/Banner/useFetchBroadBanners";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BroadBanner {
  id: string;
  title: string;
  image: string;
  link?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BannerFormData {
  title: string;
  image: File | string | null;
  link: string;
  isActive: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: BannerFormData = {
  title: "",
  image: null,
  link: "",
  isActive: true,
};

const inputCls = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white ${
    error ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

// ─── Main Component ───────────────────────────────────────────────────────────

const BroadBannerManagement: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { banners: items, isLoading, refetch } = useFetchBroadBanners();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    else if (formData.title.trim().length > 200)
      errors.title = "Max 200 characters";
    if (!formData.image) errors.image = "Image is required";
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
    () => !!formData.title.trim() && !!formData.image,
    [formData.title, formData.image],
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

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

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB");
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      setValidationErrors((prev) => ({ ...prev, image: "" }));
    },
    [],
  );

  const imagePreview = useMemo(() => {
    if (!formData.image) return null;
    if (formData.image instanceof File)
      return URL.createObjectURL(formData.image);
    return formData.image;
  }, [formData.image]);

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
  }, []);

  const handleEdit = useCallback((banner: BroadBanner) => {
    setEditingId(banner.id);
    setIsAdding(false);
    setFormData({
      title: banner.title,
      image: banner.image,
      link: banner.link ?? "",
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

  // ── API Calls ─────────────────────────────────────────────────────────────────

  const saveItem = useCallback(
    async (id?: string) => {
      if (!validateForm()) {
        toast.error("Please fix the errors before saving");
        return;
      }
      setIsSaving(true);
      try {
        let imageUrl: string = formData.image as string;
        if (formData.image instanceof File) {
          imageUrl = await handleUploadWithCloudinary(formData.image);
        }

        const payload = {
          title: formData.title.trim(),
          image: imageUrl,
          link: formData.link.trim() || null,
          isActive: formData.isActive,
        };

        if (id) {
          await axiosSecure.patch(`/banners/broad-banner/${id}`, payload);
          toast.success("Banner updated");
          setEditingId(null);
        } else {
          await axiosSecure.post("/banners/broad-banner", payload);
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
    async (banner: BroadBanner) => {
      try {
        await axiosSecure.patch(`/banners/broad-banner/${banner.id}`, {
          isActive: !banner.isActive,
        });
        toast.success(
          `"${banner.title}" is now ${!banner.isActive ? "active" : "inactive"}`,
        );
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
      await axiosSecure.delete(`/banners/broad-banner/${deleteId}`);
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

  // ── Render ────────────────────────────────────────────────────────────────────

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
            <Megaphone size={20} className="text-indigo-600" />
            Broad banners
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sitewide promotional banners — only one banner can be active at a
            time
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
              {["Image", "Title", "Link", "Status", "Actions"].map((h) => (
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
            {/* Add row */}
            {isAdding && (
              <EditRow
                formData={formData}
                imagePreview={imagePreview}
                errors={validationErrors}
                isSaving={isSaving}
                isFormValid={isFormValid}
                onFieldChange={handleFieldChange}
                onImageChange={handleImageChange}
                onImageRemove={removeImage}
                onSave={() => saveItem()}
                onCancel={handleCancel}
              />
            )}

            {/* Existing rows */}
            {items.map((banner: BroadBanner) =>
              editingId === banner.id ? (
                <EditRow
                  key={banner.id}
                  formData={formData}
                  imagePreview={imagePreview}
                  errors={validationErrors}
                  isSaving={isSaving}
                  isFormValid={isFormValid}
                  onFieldChange={handleFieldChange}
                  onImageChange={handleImageChange}
                  onImageRemove={removeImage}
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
          <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No banners yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a sitewide banner to promote offers or announcements
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

      {/* Delete modal */}
      {deleteId && (
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

// Banner image thumbnail
const BannerPreview: FC<{
  image: string;
  title: string;
}> = ({ image, title }) => (
  <div className="w-28 h-14 rounded-md overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
    {image ? (
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
      />
    ) : (
      <Upload size={16} className="text-gray-300" />
    )}
  </div>
);

// View row
interface ViewRowProps {
  banner: BroadBanner;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}
const ViewRow: FC<ViewRowProps> = ({
  banner,
  disabled,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <tr className="hover:bg-gray-50 transition-colors group">
    {/* Image */}
    <td className="px-5 py-4 align-middle">
      <BannerPreview image={banner.image} title={banner.title} />
    </td>

    {/* Title */}
    <td className="px-5 py-4 align-middle">
      <p className="font-semibold text-sm text-gray-900 truncate max-w-[200px]">
        {banner.title}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        #{banner.id} ·{" "}
        {banner.createdAt
          ? new Date(banner.createdAt).toLocaleDateString()
          : ""}
      </p>
    </td>

    {/* Link */}
    <td className="px-5 py-4 align-middle">
      {banner.link ? (
        <a
          href={banner.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline font-mono"
        >
          <ExternalLink size={10} className="shrink-0" />
          {banner.link}
        </a>
      ) : (
        <span className="text-xs text-gray-400">—</span>
      )}
    </td>

    {/* Status */}
    <td className="px-5 py-4 align-middle">
      <button
        onClick={onToggle}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
          banner.isActive
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        title="Click to toggle"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            banner.isActive ? "bg-emerald-500" : "bg-gray-400"
          }`}
        />
        {banner.isActive ? "Active" : "Inactive"}
      </button>
    </td>

    {/* Actions */}
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

// Edit row
interface EditRowProps {
  formData: BannerFormData;
  imagePreview: string | null;
  errors: Record<string, string>;
  isSaving: boolean;
  isFormValid: boolean;
  onFieldChange: (field: keyof BannerFormData, value: any) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onSave: () => void;
  onCancel: () => void;
}
const EditRow: FC<EditRowProps> = ({
  formData,
  imagePreview,
  errors,
  isSaving,
  isFormValid,
  onFieldChange,
  onImageChange,
  onImageRemove,
  onSave,
  onCancel,
}) => (
  <tr className="bg-indigo-50/40">
    {/* Image upload */}
    <td className="px-5 py-4 align-top">
      {imagePreview ? (
        <div className="relative w-28 h-14 rounded-lg overflow-hidden border border-gray-200 group">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <label
          className={`relative w-28 h-14 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors gap-0.5 ${
            errors.image
              ? "border-red-400 bg-red-50"
              : "border-gray-300 hover:border-indigo-400"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload
            size={14}
            className={errors.image ? "text-red-400" : "text-gray-400"}
          />
          <span
            className={`text-[10px] ${errors.image ? "text-red-400" : "text-gray-400"}`}
          >
            Upload *
          </span>
        </label>
      )}
      {errors.image && (
        <p className="text-xs text-red-600 mt-1">{errors.image}</p>
      )}
    </td>

    {/* Title */}
    <td className="px-5 py-4 align-top">
      <div className="min-w-[200px]">
        <input
          type="text"
          placeholder="Title *"
          value={formData.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          className={inputCls(errors.title)}
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1">{errors.title}</p>
        )}
      </div>
    </td>

    {/* Link */}
    <td className="px-5 py-4 align-top">
      <div className="min-w-[160px]">
        <div className="relative">
          <LinkIcon
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="/sale or https://..."
            value={formData.link}
            onChange={(e) => onFieldChange("link", e.target.value)}
            className={`${inputCls(errors.link)} pl-8 font-mono text-xs`}
          />
        </div>
        {errors.link && (
          <p className="text-xs text-red-600 mt-1">{errors.link}</p>
        )}
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
      {formData.isActive && (
        <p className="text-xs text-amber-600 mt-1.5 max-w-[120px]">
          Will deactivate other banners
        </p>
      )}
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

export default BroadBannerManagement;
