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
  GripVertical,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";
import useFetchHomepageGallery, {
  HomepageGalleryItem,
} from "@/hooks/Homepage/Gallery/useFetchHomepageGallery";
import { useHasPermission } from "@/context/PermissionsContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryFormData {
  name: string;
  image: File | string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  isHeading: boolean; // Add this
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: GalleryFormData = {
  name: "",
  image: null,
  slug: "",
  sortOrder: 0,
  isActive: true,
  isHeading: false, // Add this
};

const inputClass = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

/** Auto-generate slug from name */
const toSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// ─── Main Component ───────────────────────────────────────────────────────────

const AllHomepageGalleryComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { items, isLoading, refetch } = useFetchHomepageGallery();
  const canCreate = useHasPermission("HOMEPAGE_GALLERY_CREATE");
  const canUpdate = useHasPermission("HOMEPAGE_GALLERY_UPDATE");
  const canDelete = useHasPermission("HOMEPAGE_GALLERY_DELETE");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<GalleryFormData>(DEFAULT_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // ── Validation ───────────────

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    else if (formData.name.trim().length > 200)
      errors.name = "Name must be under 200 characters";

    if (!formData.image) errors.image = "Image is required";

    if (!formData.slug.trim()) errors.slug = "Slug is required";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim()))
      errors.slug = "Lowercase letters, numbers and hyphens only";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const isFormValid = useMemo(
    () => !!(formData.name.trim() && formData.image && formData.slug.trim()),
    [formData],
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setImagePreview(null);
    setValidationErrors({});
  }, []);

  const handleInputChange = useCallback(
    (field: keyof GalleryFormData, value: any) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        // Auto-generate slug when name changes (only when slug hasn't been manually edited)
        if (field === "name" && prev.slug === toSlug(prev.name)) {
          next.slug = toSlug(value as string);
        }
        return next;
      });
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
      setImagePreview(URL.createObjectURL(file));
      setValidationErrors((prev) => ({ ...prev, image: "" }));
    },
    [],
  );

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  }, []);

  const handleEdit = useCallback((item: HomepageGalleryItem) => {
    setEditingId(item.id);
    setIsAdding(false);
    setFormData({
      name: item.name,
      image: item.image,
      slug: item.slug,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      isHeading: item.isHeading,
    });
    setImagePreview(item.image || null);
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

  const saveItem = useCallback(
    async (id?: number) => {
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
          name: formData.name.trim(),
          image: imageUrl,
          slug: formData.slug.trim(),
          sortOrder: Number(formData.sortOrder),
          isActive: formData.isActive,
          isHeading: formData.isHeading,
        };

        if (id) {
          await axiosSecure.put(`/homepage-gallery/${id}`, payload);
          toast.success("Item updated successfully");
          setEditingId(null);
        } else {
          await axiosSecure.post("/homepage-gallery", payload);
          toast.success("Item added successfully");
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
    async (item: HomepageGalleryItem) => {
      try {
        await axiosSecure.put(`/homepage-gallery/${item.id}`, {
          isActive: !item.isActive,
        });
        toast.success(
          `"${item.name}" is now ${!item.isActive ? "active" : "inactive"}`,
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
      await axiosSecure.delete(`/homepage-gallery/${deleteId}`);
      toast.success("Item deleted");
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

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LayoutGrid size={20} className="text-indigo-600" />
            Homepage Gallery
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage the marquee product gallery shown on the homepage
          </p>
        </div>
        {canCreate && !isAdding && (
          <button
            disabled={editingId !== null}
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Item
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
                "Type",
                "Image",
                "Name & Slug",
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
                {/* grip for dnd */}
                <td className="px-3 py-4 text-gray-300">
                  <GripVertical size={18} />
                </td>

                {/* HERO BANNER */}
                <td className="px-5 py-4 align-top">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isHeading}
                      onChange={(e) =>
                        handleInputChange("isHeading", e.target.checked)
                      }
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Hero Banner
                    </span>
                  </label>
                </td>

                <td className="px-5 py-4 align-top">
                  <GalleryImageUpload
                    imagePreview={imagePreview}
                    onImageChange={handleImageChange}
                    onImageRemove={removeImage}
                    error={validationErrors.image}
                    isHeading={formData.isHeading}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <NameSlugFields
                    name={formData.name}
                    slug={formData.slug}
                    onNameChange={(v) => handleInputChange("name", v)}
                    onSlugChange={(v) => handleInputChange("slug", v)}
                    nameError={validationErrors.name}
                    slugError={validationErrors.slug}
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
                      onClick={() => saveItem()}
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
            {sorted.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Drag handle */}
                  <td className="px-3 py-4 text-gray-300 group-hover:text-gray-400 cursor-grab">
                    <GripVertical size={18} />
                  </td>

                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isHeading}
                          onChange={(e) =>
                            handleInputChange("isHeading", e.target.checked)
                          }
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Hero Banner
                        </span>
                      </label>
                    ) : item.isHeading ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">
                        Heading
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 uppercase">
                        Regular
                      </span>
                    )}
                  </td>

                  {/* Image */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <GalleryImageUpload
                        imagePreview={imagePreview}
                        onImageChange={handleImageChange}
                        onImageRemove={removeImage}
                        error={validationErrors.image}
                        isHeading={formData.isHeading}
                      />
                    ) : (
                      <div
                        className={`${item.isHeading ? "w-24 h-10" : "w-14 h-20"} rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0`}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <ImageIcon size={18} className="text-gray-300" />
                        )}
                      </div>
                    )}
                  </td>

                  {/* Name & Slug */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <NameSlugFields
                        name={formData.name}
                        slug={formData.slug}
                        onNameChange={(v) => handleInputChange("name", v)}
                        onSlugChange={(v) => handleInputChange("slug", v)}
                        nameError={validationErrors.name}
                        slugError={validationErrors.slug}
                      />
                    ) : (
                      <div>
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">
                          {item.name}
                        </p>
                        <a
                          href={`/products/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline mt-0.5 font-mono"
                        >
                          <ExternalLink size={10} className="shrink-0" />
                          /products/{item.slug}
                        </a>
                        <p className="text-xs text-gray-400 mt-0.5">
                          #{item.id}
                        </p>
                      </div>
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
                        {item.sortOrder}
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
                        isActive={item.isActive}
                        onToggle={canUpdate ? () => toggleStatus(item) : undefined}
                      />
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveItem(item.id)}
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
                            onClick={() => handleEdit(item)}
                            disabled={isAdding}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(item.id)}
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
          <LayoutGrid size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No gallery items yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Add products to display in the homepage marquee gallery
          </p>
          {canCreate && (
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              Add Item
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

// ─── Sub-components ───────────────────────────────────────────────────────────

// Image upload
interface GalleryImageUploadProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  error?: string;
  isHeading?: boolean;
}
const GalleryImageUpload: FC<GalleryImageUploadProps> = ({
  imagePreview,
  onImageChange,
  onImageRemove,
  error,
  isHeading,
}) => (
  <div className="flex flex-col gap-1">
    {imagePreview ? (
      <div
        className={`relative ${isHeading ? "w-24 h-10" : "w-14 h-20"} border rounded-lg overflow-hidden group`}
      >
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
        className={`relative ${isHeading ? "w-24 h-10" : "w-14 h-20"} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group ${
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

// Name + Slug fields
interface NameSlugFieldsProps {
  name: string;
  slug: string;
  onNameChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  nameError?: string;
  slugError?: string;
}
const NameSlugFields: FC<NameSlugFieldsProps> = ({
  name,
  slug,
  onNameChange,
  onSlugChange,
  nameError,
  slugError,
}) => (
  <div className="space-y-2 min-w-[200px]">
    <div className="space-y-1">
      <input
        type="text"
        placeholder="e.g. Summer Dress"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className={inputClass(nameError)}
      />
      {nameError && <p className="text-xs text-red-600">{nameError}</p>}
    </div>
    <div className="space-y-1">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono select-none">
          /products/
        </span>
        <input
          type="text"
          placeholder="summer-dress"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className={`${inputClass(slugError)} pl-19 font-mono text-xs`}
        />
      </div>
      {slugError && <p className="text-xs text-red-600">{slugError}</p>}
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

// Active toggle (edit mode)
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

// Status badge (view mode, clickable)
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

export default AllHomepageGalleryComp;
