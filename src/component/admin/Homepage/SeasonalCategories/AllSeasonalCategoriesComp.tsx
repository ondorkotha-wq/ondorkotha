/* eslint-disable @next/next/no-img-element */
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
  Layers,
  GripVertical,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";
import useFetchSeasonalCategories, {
  SeasonalCategory,
} from "@/hooks/Homepage/SeasonalCategories/useFetchSeasonalCategories";
import { useHasPermission } from "@/context/PermissionsContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryFormData {
  title: string;
  image: File | string | null;
  link: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: CategoryFormData = {
  title: "",
  image: null,
  link: "",
  sortOrder: 0,
  isActive: true,
  startDate: "",
  endDate: "",
};

const inputClass = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

const toLocalDatetimeString = (iso: string | null) => {
  if (!iso) return "";
  return iso.slice(0, 16);
};

const formatDateDisplay = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getScheduleStatus = (
  cat: SeasonalCategory,
): "scheduled" | "expired" | "live" | "none" => {
  if (!cat.startDate && !cat.endDate) return "none";
  const now = new Date();
  const start = cat.startDate ? new Date(cat.startDate) : null;
  const end = cat.endDate ? new Date(cat.endDate) : null;
  if (end && now > end) return "expired";
  if (start && now < start) return "scheduled";
  return "live";
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AllSeasonalCategoriesComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { categories, isLoading, refetch } = useFetchSeasonalCategories(null);
  const canCreate = useHasPermission("SEASONAL_CATEGORY_CREATE");
  const canUpdate = useHasPermission("SEASONAL_CATEGORY_UPDATE");
  const canDelete = useHasPermission("SEASONAL_CATEGORY_DELETE");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(DEFAULT_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Title is required";
    else if (formData.title.trim().length > 200)
      errors.title = "Title must be under 200 characters";

    if (!formData.image) errors.image = "Image is required";

    if (!formData.link.trim()) errors.link = "Link is required";

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.endDate = "End date must be after start date";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const isFormValid = useMemo(() => {
    return !!(formData.title.trim() && formData.image && formData.link.trim());
  }, [formData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setImagePreview(null);
    setValidationErrors({});
  }, []);

  const handleInputChange = useCallback(
    (field: keyof CategoryFormData, value: any) => {
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
        toast.error("Image size should be less than 5MB");
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setValidationErrors((prev) => ({ ...prev, image: "" }));
    },
    [],
  );

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  }, []);

  const handleEdit = useCallback((cat: SeasonalCategory) => {
    setEditingId(cat.id);
    setIsAdding(false);
    setFormData({
      title: cat.title,
      image: cat.image, // existing URL string
      link: cat.link,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      startDate: toLocalDatetimeString(cat.startDate),
      endDate: toLocalDatetimeString(cat.endDate),
    });
    setImagePreview(cat.image || null);
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

  // ── API calls ─────────────────────────────────────────────────────────────────

  const saveCategory = useCallback(
    async (id?: number) => {
      if (!validateForm()) {
        toast.error("Please fix the errors before saving");
        return;
      }

      setIsSaving(true);
      try {
        // Upload to Cloudinary only if a new File was selected
        let imageUrl: string = formData.image as string;
        if (formData.image instanceof File) {
          imageUrl = await handleUploadWithCloudinary(formData.image);
        }

        const payload = {
          title: formData.title.trim(),
          image: imageUrl,
          link: formData.link.trim(),
          sortOrder: Number(formData.sortOrder),
          isActive: formData.isActive,
          ...(formData.startDate
            ? { startDate: new Date(formData.startDate).toISOString() }
            : { startDate: null }),
          ...(formData.endDate
            ? { endDate: new Date(formData.endDate).toISOString() }
            : { endDate: null }),
        };

        if (id) {
          await axiosSecure.put(`/seasonal-categories/${id}`, payload);
          toast.success("Category updated successfully");
          setEditingId(null);
        } else {
          await axiosSecure.post("/seasonal-categories", payload);
          toast.success("Category created successfully");
          setIsAdding(false);
        }

        resetForm();
        await refetch();
      } catch (error: any) {
        const apiError = error as ApiError;
        toast.error(apiError?.response?.data?.message || "Operation failed");
      } finally {
        setIsSaving(false);
      }
    },
    [axiosSecure, formData, refetch, resetForm, validateForm],
  );

  const toggleStatus = useCallback(
    async (cat: SeasonalCategory) => {
      try {
        await axiosSecure.put(`/seasonal-categories/${cat.id}`, {
          isActive: !cat.isActive,
        });
        toast.success(
          `"${cat.title}" is now ${!cat.isActive ? "active" : "inactive"}`,
        );
        await refetch();
      } catch {
        toast.error("Failed to update status");
      }
    },
    [axiosSecure, refetch],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/seasonal-categories/${deleteId}`);
      toast.success("Category deleted");
      setDeleteId(null);
      await refetch();
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message || "Delete failed");
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

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers size={20} className="text-indigo-600" />
            Seasonal Categories
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage seasonal category tiles with scheduling
          </p>
        </div>
        {canCreate && !isAdding && (
          <button
            disabled={editingId !== null}
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Category
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "",
                "Image",
                "Title & Link",
                "Schedule",
                "Order",
                "Status",
                "Actions",
              ].map((h) => (
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
            {/* ── Add Row ── */}
            {isAdding && (
              <tr className="bg-indigo-50/40">
                <td className="px-3 py-4 text-gray-300">
                  <GripVertical size={18} />
                </td>
                {/* Image upload */}
                <td className="px-5 py-4 align-top">
                  <CategoryImageUpload
                    imagePreview={imagePreview}
                    onImageChange={handleImageChange}
                    onImageRemove={removeImage}
                    error={validationErrors.image}
                  />
                </td>
                {/* Title & Link */}
                <td className="px-5 py-4 align-top">
                  <TitleLinkFields
                    title={formData.title}
                    link={formData.link}
                    onTitleChange={(v) => handleInputChange("title", v)}
                    onLinkChange={(v) => handleInputChange("link", v)}
                    titleError={validationErrors.title}
                    linkError={validationErrors.link}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <ScheduleFields
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    onStartChange={(v) => handleInputChange("startDate", v)}
                    onEndChange={(v) => handleInputChange("endDate", v)}
                    endError={validationErrors.endDate}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <SortOrderField
                    value={formData.sortOrder}
                    onChange={(v) => handleInputChange("sortOrder", v)}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <ActiveToggle
                    isActive={formData.isActive}
                    onChange={(v) => handleInputChange("isActive", v)}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => saveCategory()}
                      disabled={!isFormValid || isSaving}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Existing Rows ── */}
            {sorted.map((cat: SeasonalCategory) => {
              const isEditing = editingId === cat.id;
              const schedStatus = getScheduleStatus(cat);

              return (
                <tr
                  key={cat.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Drag handle */}
                  <td className="px-3 py-4 text-gray-300 group-hover:text-gray-400 cursor-grab">
                    <GripVertical size={18} />
                  </td>

                  {/* Image */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <CategoryImageUpload
                        imagePreview={imagePreview}
                        onImageChange={handleImageChange}
                        onImageRemove={removeImage}
                        error={validationErrors.image}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <ImageIcon size={20} className="text-gray-300" />
                        )}
                      </div>
                    )}
                  </td>

                  {/* Title & Link */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <TitleLinkFields
                        title={formData.title}
                        link={formData.link}
                        onTitleChange={(v) => handleInputChange("title", v)}
                        onLinkChange={(v) => handleInputChange("link", v)}
                        titleError={validationErrors.title}
                        linkError={validationErrors.link}
                      />
                    ) : (
                      <div>
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[160px]">
                          {cat.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 mb-1">
                          #{cat.id}
                        </p>
                        <a
                          href={cat.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline max-w-[160px] truncate"
                        >
                          <ExternalLink size={11} className="shrink-0" />
                          {cat.link}
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Schedule */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <ScheduleFields
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        onStartChange={(v) => handleInputChange("startDate", v)}
                        onEndChange={(v) => handleInputChange("endDate", v)}
                        endError={validationErrors.endDate}
                      />
                    ) : (
                      <ScheduleBadge cat={cat} status={schedStatus} />
                    )}
                  </td>

                  {/* Sort Order */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <SortOrderField
                        value={formData.sortOrder}
                        onChange={(v) => handleInputChange("sortOrder", v)}
                      />
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                        {cat.sortOrder}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <ActiveToggle
                        isActive={formData.isActive}
                        onChange={(v) => handleInputChange("isActive", v)}
                      />
                    ) : (
                      <StatusBadge
                        isActive={cat.isActive}
                        onToggle={canUpdate ? () => toggleStatus(cat) : undefined}
                      />
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveCategory(cat.id)}
                          disabled={!isFormValid || isSaving}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(cat)}
                            disabled={isAdding}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(cat.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <Layers size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No seasonal categories yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create category tiles that appear on the homepage
          </p>
          {canCreate && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Category
            </button>
          )}
        </div>
      )}

      {/* Delete Modal */}
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

// Image upload (Cloudinary — mirrors BannerImageUpload)
interface CategoryImageUploadProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  error?: string;
}
const CategoryImageUpload: FC<CategoryImageUploadProps> = ({
  imagePreview,
  onImageChange,
  onImageRemove,
  error,
}) => (
  <div className="flex flex-col gap-1">
    {imagePreview ? (
      <div className="relative w-16 h-16 border rounded-lg overflow-hidden group">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={onImageRemove}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          title="Remove image"
        >
          <X size={12} />
        </button>
      </div>
    ) : (
      <label
        className={`relative w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group ${
          error
            ? "border-red-400 bg-red-50"
            : "border-gray-300 hover:border-indigo-500"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload
          size={16}
          className={
            error ? "text-red-400" : "text-gray-400 group-hover:text-indigo-500"
          }
        />
        <span
          className={`text-[10px] mt-1 ${
            error ? "text-red-400" : "text-gray-400 group-hover:text-indigo-500"
          }`}
        >
          Upload
        </span>
      </label>
    )}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Title + Link fields (merged — image is now its own column)
interface TitleLinkFieldsProps {
  title: string;
  link: string;
  onTitleChange: (v: string) => void;
  onLinkChange: (v: string) => void;
  titleError?: string;
  linkError?: string;
}
const TitleLinkFields: FC<TitleLinkFieldsProps> = ({
  title,
  link,
  onTitleChange,
  onLinkChange,
  titleError,
  linkError,
}) => (
  <div className="space-y-2 min-w-45">
    <div className="space-y-1">
      <input
        type="text"
        placeholder="e.g. Winter Collection"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className={inputClass(titleError)}
      />
      {titleError && <p className="text-xs text-red-600">{titleError}</p>}
    </div>
    <div className="space-y-1">
      <div className="relative">
        <LinkIcon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="/collections/winter"
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          className={`${inputClass(linkError)} pl-8`}
        />
      </div>
      {linkError && <p className="text-xs text-red-600">{linkError}</p>}
    </div>
  </div>
);

// Schedule date range fields
interface ScheduleFieldsProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  endError?: string;
}

const ScheduleFields: FC<ScheduleFieldsProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  endError,
}) => (
  <div className="space-y-1.5 min-w-45">
    <div>
      <label className="text-xs text-gray-500 mb-0.5 block">Start</label>
      <input
        type="datetime-local"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className={inputClass()}
      />
    </div>
    <div>
      <label className="text-xs text-gray-500 mb-0.5 block">End</label>
      <input
        type="datetime-local"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className={inputClass(endError)}
      />
      {endError && <p className="text-xs text-red-600">{endError}</p>}
    </div>
  </div>
);

// Sort order
interface SortOrderFieldProps {
  value: number;
  onChange: (v: number) => void;
}
const SortOrderField: FC<SortOrderFieldProps> = ({ value, onChange }) => (
  <input
    type="number"
    min={0}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className={`${inputClass()} w-20 text-center`}
  />
);

// Active Toggle (edit mode)
interface ActiveToggleProps {
  isActive: boolean;
  onChange: (v: boolean) => void;
}
const ActiveToggle: FC<ActiveToggleProps> = ({ isActive, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input
      type="checkbox"
      checked={isActive}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
    />
    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
      {isActive ? "Active" : "Inactive"}
    </span>
  </label>
);

// Status Badge (view mode, clickable)
interface StatusBadgeProps {
  isActive: boolean;
  onToggle?: () => void;
}
const StatusBadge: FC<StatusBadgeProps> = ({ isActive, onToggle }) => (
  <button
    onClick={onToggle}
    disabled={!onToggle}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
      onToggle ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default"
    } ${
      isActive
        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
    title={onToggle ? "Click to toggle" : undefined}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        isActive ? "bg-emerald-500" : "bg-gray-400"
      }`}
    />
    {isActive ? "Active" : "Inactive"}
  </button>
);

// Schedule badge (view mode)
interface ScheduleBadgeProps {
  cat: SeasonalCategory;
  status: "scheduled" | "expired" | "live" | "none";
}
const ScheduleBadge: FC<ScheduleBadgeProps> = ({ cat, status }) => {
  if (status === "none") {
    return <span className="text-xs text-gray-400 italic">Always visible</span>;
  }

  const config = {
    live: {
      bg: "bg-sky-50",
      text: "text-sky-700",
      dot: "bg-sky-500",
      label: "Live",
    },
    scheduled: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-400",
      label: "Scheduled",
    },
    expired: {
      bg: "bg-red-50",
      text: "text-red-600",
      dot: "bg-red-400",
      label: "Expired",
    },
  }[status];

  return (
    <div className="space-y-1 min-w-[130px]">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      <div className="text-xs text-gray-400 space-y-0.5">
        {cat.startDate && (
          <div className="flex items-center gap-1">
            <Calendar size={10} />
            <span>From {formatDateDisplay(cat.startDate)}</span>
          </div>
        )}
        {cat.endDate && (
          <div className="flex items-center gap-1">
            <Calendar size={10} />
            <span>Until {formatDateDisplay(cat.endDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSeasonalCategoriesComp;
