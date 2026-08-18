"use client";

import React, { useState, useCallback, useMemo, FC } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { Edit3, Save, Trash2, X, Plus, Palette, Upload } from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import useFetchColors from "@/hooks/Attributes/useFetchColors";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { Color } from "@/types/product.types";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../Modal/DeleteConfirmationModal";
import { useAttributeCRUD } from "@/hooks/Admin/Attributes/useAttributeCRUD";

interface ColorFormData {
  name: string;
  hexCode: string;
  sortOrder: number;
  isActive: boolean;
  image?: File | string | null;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

const DEFAULT_FORM: ColorFormData = {
  name: "",
  hexCode: "#000000",
  sortOrder: 0,
  isActive: true,
  image: null,
};

const AllColorsComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { colors, isLoading, refetch } = useFetchColors({ isActive: null });

  const {
    editingId, setEditingId,
    isAdding, setIsAdding,
    deleteId, setDeleteId,
    formData, setFormData,
    resetForm: hookResetForm,
    startAdding,
  } = useAttributeCRUD<ColorFormData>(DEFAULT_FORM);

  // Image/validation states are specific to Colors — not in the shared hook
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isFormValid = useMemo(
    () => formData.name.trim().length > 0 && /^#[0-9A-F]{6}$/i.test(formData.hexCode),
    [formData.name, formData.hexCode],
  );

  const resetForm = useCallback(() => {
    hookResetForm();
    setImagePreview(null);
    setValidationErrors({});
  }, [hookResetForm]);

  const handleInputChange = useCallback(
    <K extends keyof ColorFormData>(field: K, value: ColorFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [setFormData],
  );

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
      if (file.size > 5 * 1024 * 1024) return toast.error("Image size should be less than 5MB");
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    },
    [setFormData],
  );

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  }, [setFormData]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Color name is required";
    if (!/^#[0-9A-F]{6}$/i.test(formData.hexCode)) errors.hexCode = "Invalid hex code format (e.g., #FF0000)";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name, formData.hexCode]);

  const handleEdit = useCallback((color: Color) => {
    setEditingId(color.id);
    setIsAdding(false);
    setFormData({
      name: color.name,
      hexCode: color.hexCode ?? "#000000",
      sortOrder: color.sortOrder || 0,
      isActive: color.isActive ?? true,
      image: color.image || null,
    });
    setImagePreview(color.image || null);
    setValidationErrors({});
  }, [setEditingId, setIsAdding, setFormData]);

  const handleCancel = useCallback(() => resetForm(), [resetForm]);

  const toggleStatusQuickly = useCallback(async (color: Color) => {
    setIsUploading(true);
    try {
      await axiosSecure.patch(`/colors/${color.id}`, { isActive: !color.isActive });
      toast.success(`${color.name} is now ${!color.isActive ? "Active" : "Inactive"}`);
      await refetch();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUploading(false);
    }
  }, [axiosSecure, refetch]);

  const saveColor = useCallback(async (id?: number) => {
    if (!validateForm()) return toast.error("Please fix validation errors");
    setIsUploading(true);
    try {
      let imageUrl: File | string | null | undefined = formData.image;
      if (formData.image instanceof File) {
        imageUrl = await handleUploadWithCloudinary(formData.image);
      }
      const payload = { ...formData, image: imageUrl || null };
      if (id) {
        await axiosSecure.patch(`/colors/${id}`, payload);
        toast.success("Color updated successfully");
        setEditingId(null);
      } else {
        await axiosSecure.post("/colors", payload);
        toast.success("Color added successfully");
        setIsAdding(false);
      }
      resetForm();
      await refetch();
    } catch (error: unknown) {
      toast.error((error as ApiError)?.response?.data?.message || "Operation failed");
    } finally {
      setIsUploading(false);
    }
  }, [axiosSecure, formData, refetch, resetForm, validateForm, setEditingId, setIsAdding]);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/colors/${deleteId}`);
      toast.success("Color deleted successfully");
      setDeleteId(null);
      await refetch();
    } catch (error: unknown) {
      toast.error((error as ApiError)?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch, setDeleteId]);

  if (isLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Palette size={20} className="text-indigo-600" />
            Color Library
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage product color swatches and codes</p>
        </div>

        {!isAdding && (
          <button
            disabled={editingId !== null}
            onClick={startAdding}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Color
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Visual", "Color Info", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {isAdding && (
              <tr className="bg-indigo-50/50">
                <td className="px-6 py-4">
                  <ColorVisual
                    hexCode={formData.hexCode}
                    imagePreview={imagePreview}
                    onHexCodeChange={(v) => handleInputChange("hexCode", v)}
                    onImageChange={handleImageChange}
                    onImageRemove={removeImage}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Color name (e.g., Ocean Blue)"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={`block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.name ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.name && <p className="text-xs text-red-600">{validationErrors.name}</p>}
                    <input
                      type="text"
                      placeholder="#000000"
                      value={formData.hexCode}
                      onChange={(e) => handleInputChange("hexCode", e.target.value)}
                      className={`block w-full text-xs font-mono border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${validationErrors.hexCode ? "border-red-500" : "border-gray-300"}`}
                    />
                    {validationErrors.hexCode && <p className="text-xs text-red-600">{validationErrors.hexCode}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Active</span>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => saveColor()}
                      disabled={!isFormValid || isUploading}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Saving..." : "Save"}
                    </button>
                    <button onClick={handleCancel} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {colors?.map((color: Color) => {
              const isEditing = editingId === color.id;
              return (
                <tr key={color.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <ColorVisual
                        hexCode={formData.hexCode}
                        imagePreview={imagePreview}
                        onHexCodeChange={(v) => handleInputChange("hexCode", v)}
                        onImageChange={handleImageChange}
                        onImageRemove={removeImage}
                      />
                    ) : (
                      <ColorSwatch color={color} />
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="text-sm font-medium border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{color.name}</div>
                        <div className="text-xs font-mono text-gray-500 uppercase">{color.hexCode}</div>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange("isActive", e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                          {formData.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    ) : (
                      <StatusBadge
                        isActive={color.isActive}
                        onToggle={() => toggleStatusQuickly(color)}
                        isPending={isUploading}
                      />
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveColor(color.id)}
                          disabled={!isFormValid || isUploading}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save size={18} />
                        </button>
                        <button onClick={handleCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(color)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => setDeleteId(color.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {colors?.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <Palette size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No colors yet</h3>
          <p className="text-sm text-gray-500 mb-4">Get started by adding your first color</p>
          <button
            onClick={startAdding}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Add Color
          </button>
        </div>
      )}

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

const ColorSwatch: FC<{ color: Color }> = ({ color }) => (
  <div className="w-10 h-10 rounded-full border border-gray-200 shadow-inner overflow-hidden" style={{ backgroundColor: color.hexCode }}>
    {color.image && <img src={color.image} alt={color.name} className="w-full h-full object-cover" loading="lazy" />}
  </div>
);

interface ColorVisualProps {
  hexCode: string;
  imagePreview: string | null;
  onHexCodeChange: (v: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

const ColorVisual: FC<ColorVisualProps> = ({ hexCode, imagePreview, onHexCodeChange, onImageChange, onImageRemove }) => (
  <div className="flex flex-col gap-2">
    <input type="color" value={hexCode} onChange={(e) => onHexCodeChange(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-2 border-white shadow-md" />
    {imagePreview ? (
      <div className="relative w-20 h-20 border rounded-md overflow-hidden group">
        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onImageRemove}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X size={12} />
        </button>
      </div>
    ) : (
      <label className="relative w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group">
        <input type="file" accept="image/*" onChange={onImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <Upload size={20} className="text-gray-400 group-hover:text-indigo-500" />
      </label>
    )}
  </div>
);

const StatusBadge: FC<{ isActive?: boolean; onToggle?: () => void; isPending?: boolean }> = ({ isActive, onToggle, isPending }) => (
  <button
    onClick={onToggle}
    disabled={isPending}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
    {isActive ? "Active" : "Inactive"}
  </button>
);

export default AllColorsComp;
