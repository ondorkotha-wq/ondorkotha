/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useCallback, useMemo, FC } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import {
  Edit3,
  Save,
  Trash2,
  X,
  Plus,
  Upload,
  Grid3X3,
  GripVertical,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";
import { useHasPermission } from "@/context/PermissionsContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubcategoryOption {
  id: number;
  name: string;
  slug: string;
  category: { id: number; name: string; series: { id: number; name: string } };
}

interface FeaturedTile {
  id: number;
  image: string;
  sortOrder: number;
  isActive: boolean;
  subcategory: SubcategoryOption;
}

interface TopSearchKeyword {
  keyword: string;
  count: number;
}

interface TileFormData {
  subcategoryId: string;
  image: File | string | null;
  sortOrder: string;
  isActive: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: TileFormData = {
  subcategoryId: "",
  image: null,
  sortOrder: "0",
  isActive: true,
};

const inputCls = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white ${
    error ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

// ─── Main Component ───────────────────────────────────────────────────────────

const FeaturedCategoriesManagement: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();
  const canManage = useHasPermission("FEATURED_CATEGORY_MANAGE");

  const { data: tiles = [], isLoading: tilesLoading, refetch } = useQuery<FeaturedTile[]>({
    queryKey: ["featured-categories-admin"],
    queryFn: async () => {
      const res = await axiosSecure.get("/featured-categories/admin/all");
      return res.data;
    },
  });

  const { data: subcategories = [], isLoading: subLoading } = useQuery<SubcategoryOption[]>({
    queryKey: ["subcategories-for-featured"],
    queryFn: async () => {
      const res = await axiosPublic.get("/subcategories?isActive=true");
      return res.data;
    },
  });

  const { data: topSearches = [], isLoading: searchLoading } = useQuery<TopSearchKeyword[]>({
    queryKey: ["top-searches-featured"],
    queryFn: async () => {
      const res = await axiosSecure.get("/dashboard/top-searches?limit=10");
      return res.data;
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TileFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.subcategoryId) errors.subcategoryId = "Subcategory is required";
    if (!formData.image) errors.image = "Image is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const isFormValid = useMemo(
    () => !!formData.subcategoryId && !!formData.image,
    [formData.subcategoryId, formData.image],
  );

  const imagePreview = useMemo(() => {
    if (!formData.image) return null;
    if (formData.image instanceof File) return URL.createObjectURL(formData.image);
    return formData.image;
  }, [formData.image]);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setValidationErrors({});
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof TileFormData, value: any) => {
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

  const handleEdit = useCallback((tile: FeaturedTile) => {
    setEditingId(tile.id);
    setIsAdding(false);
    setFormData({
      subcategoryId: String(tile.subcategory.id),
      image: tile.image,
      sortOrder: String(tile.sortOrder),
      isActive: tile.isActive,
    });
    setValidationErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  }, [resetForm]);

  const handleAddNew = useCallback(() => {
    if (tiles.length >= 6) {
      toast.error("Maximum 6 featured category tiles allowed");
      return;
    }
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  }, [resetForm, tiles.length]);

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
          subcategoryId: Number(formData.subcategoryId),
          image: imageUrl,
          sortOrder: Number(formData.sortOrder) || 0,
          isActive: formData.isActive,
        };

        if (id !== undefined) {
          await axiosSecure.patch(`/featured-categories/${id}`, payload);
          toast.success("Tile updated");
          setEditingId(null);
        } else {
          await axiosSecure.post("/featured-categories", payload);
          toast.success("Tile created");
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
    async (tile: FeaturedTile) => {
      try {
        await axiosSecure.patch(`/featured-categories/${tile.id}`, {
          isActive: !tile.isActive,
        });
        toast.success(`Tile is now ${!tile.isActive ? "active" : "inactive"}`);
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
      await axiosSecure.delete(`/featured-categories/${deleteId}`);
      toast.success("Tile deleted");
      setDeleteId(null);
      await refetch();
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message ?? "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch]);

  if (tilesLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  const isBusy = editingId !== null || isAdding;
  const maxCount = Math.max(...(topSearches.map((k) => k.count) ?? [1]), 1);

  return (
    <div className="space-y-6">
      {/* Top Searches Analytics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-indigo-500" />
          Top Search Keywords
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Use these to decide which categories to feature — customers are searching for these terms.
        </p>
        {searchLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : topSearches.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No search data available</p>
        ) : (
          <div className="space-y-3">
            {topSearches.map((kw, idx) => (
              <div key={kw.keyword}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-gray-400 w-4 shrink-0">{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{kw.keyword}</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{kw.count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all"
                    style={{ width: `${(kw.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tiles management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Grid3X3 size={20} className="text-indigo-600" />
              Featured Category Tiles
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Up to 6 manually curated category tiles shown on the homepage — {tiles.length}/6 used
            </p>
          </div>
          {canManage && !isAdding && tiles.length < 6 && (
            <button
              disabled={isBusy}
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add tile
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Order", "Image", "Subcategory", "Category / Series", "Status", "Actions"].map((h) => (
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
                  imagePreview={imagePreview}
                  errors={validationErrors}
                  isSaving={isSaving}
                  isFormValid={isFormValid}
                  subcategories={subcategories}
                  subLoading={subLoading}
                  onFieldChange={handleFieldChange}
                  onImageChange={handleImageChange}
                  onImageRemove={() => handleFieldChange("image", null)}
                  onSave={() => saveItem()}
                  onCancel={handleCancel}
                />
              )}

              {tiles.map((tile) =>
                editingId === tile.id ? (
                  <EditRow
                    key={tile.id}
                    formData={formData}
                    imagePreview={imagePreview}
                    errors={validationErrors}
                    isSaving={isSaving}
                    isFormValid={isFormValid}
                    subcategories={subcategories}
                    subLoading={subLoading}
                    onFieldChange={handleFieldChange}
                    onImageChange={handleImageChange}
                    onImageRemove={() => handleFieldChange("image", null)}
                    onSave={() => saveItem(tile.id)}
                    onCancel={handleCancel}
                  />
                ) : (
                  <TileViewRow
                    key={tile.id}
                    tile={tile}
                    disabled={isBusy}
                    canManage={canManage}
                    onEdit={() => handleEdit(tile)}
                    onDelete={() => setDeleteId(tile.id)}
                    onToggle={() => toggleActive(tile)}
                  />
                ),
              )}
            </tbody>
          </table>
        </div>

        {tiles.length === 0 && !isAdding && (
          <div className="text-center py-14">
            <Grid3X3 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tiles yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add up to 6 featured category tiles for the homepage
            </p>
            {canManage && (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                Add tile
              </button>
            )}
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
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TileViewRowProps {
  tile: FeaturedTile;
  disabled: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

const TileViewRow: FC<TileViewRowProps> = ({ tile, disabled, canManage, onEdit, onDelete, onToggle }) => (
  <tr className="hover:bg-gray-50 transition-colors group">
    <td className="px-5 py-4 align-middle">
      <div className="flex items-center gap-1.5 text-gray-400">
        <GripVertical size={14} />
        <span className="text-sm font-mono text-gray-500">{tile.sortOrder}</span>
      </div>
    </td>

    <td className="px-5 py-4 align-middle">
      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
        {tile.image ? (
          <img src={tile.image} alt={tile.subcategory.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Upload size={14} className="text-gray-300" />
          </div>
        )}
      </div>
    </td>

    <td className="px-5 py-4 align-middle">
      <p className="font-medium text-sm text-gray-900">{tile.subcategory.name}</p>
    </td>

    <td className="px-5 py-4 align-middle">
      <p className="text-sm text-gray-600">{tile.subcategory.category.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{tile.subcategory.category.series.name}</p>
    </td>

    <td className="px-5 py-4 align-middle">
      <button
        onClick={canManage ? onToggle : undefined}
        disabled={!canManage}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-70 ${
          canManage ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-default"
        } ${
          tile.isActive
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        title={canManage ? "Click to toggle" : undefined}
      >
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tile.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
        {tile.isActive ? "Active" : "Inactive"}
      </button>
    </td>

    <td className="px-5 py-4 align-middle">
      {canManage && (
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
      )}
    </td>
  </tr>
);

interface EditRowProps {
  formData: TileFormData;
  imagePreview: string | null;
  errors: Record<string, string>;
  isSaving: boolean;
  isFormValid: boolean;
  subcategories: SubcategoryOption[];
  subLoading: boolean;
  onFieldChange: (field: keyof TileFormData, value: any) => void;
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
  subcategories,
  subLoading,
  onFieldChange,
  onImageChange,
  onImageRemove,
  onSave,
  onCancel,
}) => (
  <tr className="bg-indigo-50/40">
    {/* Sort order */}
    <td className="px-5 py-4 align-top">
      <input
        type="number"
        min="0"
        placeholder="0"
        value={formData.sortOrder}
        onChange={(e) => onFieldChange("sortOrder", e.target.value)}
        className={`${inputCls()} w-16 text-center`}
      />
    </td>

    {/* Image upload */}
    <td className="px-5 py-4 align-top">
      {imagePreview ? (
        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onImageRemove}
            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={9} />
          </button>
        </div>
      ) : (
        <label
          className={`relative w-14 h-14 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors gap-0.5 ${
            errors.image ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-indigo-400"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload size={12} className={errors.image ? "text-red-400" : "text-gray-400"} />
          <span className={`text-[9px] ${errors.image ? "text-red-400" : "text-gray-400"}`}>Upload *</span>
        </label>
      )}
      {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
    </td>

    {/* Subcategory */}
    <td className="px-5 py-4 align-top" colSpan={2}>
      <div className="min-w-[220px]">
        <select
          value={formData.subcategoryId}
          onChange={(e) => onFieldChange("subcategoryId", e.target.value)}
          disabled={subLoading}
          className={inputCls(errors.subcategoryId)}
        >
          <option value="">Select subcategory *</option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={String(sub.id)}>
              {sub.name} — {sub.category.name} ({sub.category.series.name})
            </option>
          ))}
        </select>
        {errors.subcategoryId && (
          <p className="text-xs text-red-600 mt-1">{errors.subcategoryId}</p>
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

export default FeaturedCategoriesManagement;
