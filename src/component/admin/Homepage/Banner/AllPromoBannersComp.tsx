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
  Image as ImageIcon,
  Link as LinkIcon,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";
import useFetchPromoBanners from "@/hooks/Homepage/Banner/useFetchPromoBanners";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromoBannerLink {
  id?: number;
  text: string;
  url: string;
}

interface PromoBanner {
  id: number;
  title: string;
  text: string;
  bgColor: string;
  isActive: boolean;
  order: number;
  links: PromoBannerLink[];
  createdAt?: string;
  updatedAt?: string;
}

interface BannerFormData {
  title: string;
  text: string;
  bgColor: string;
  isActive: boolean;
  links: PromoBannerLink[];
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FORM: BannerFormData = {
  title: "",
  text: "",
  bgColor: "#0f172a",
  isActive: true,
  links: [{ text: "", url: "" }],
};

const inputClass = (error?: string) =>
  `block w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
    error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

// ─── Main Component ─────────

const AllPromoBannersComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { banners, isLoading, refetch } = useFetchPromoBanners(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Title is required";
    else if (formData.title.trim().length > 200)
      errors.title = "Title must be under 200 characters";

    if (!formData.text.trim()) errors.text = "Banner text is required";

    if (!formData.bgColor) errors.bgColor = "Background color is required";

    const validLinks = formData.links.filter(
      (l) => l.text.trim() || l.url.trim(),
    );
    validLinks.forEach((link, i) => {
      if (link.text.trim() && !link.url.trim())
        errors[`link_url_${i}`] = "URL is required when link text is provided";
      if (link.url.trim() && !link.text.trim())
        errors[`link_text_${i}`] = "Link text is required when URL is provided";
      if (link.url.trim()) {
        try {
          new URL(link.url.trim());
        } catch {
          errors[`link_url_${i}`] = "Must be a valid URL (include https://)";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const isFormValid = useMemo(() => {
    return !!(
      formData.title.trim() &&
      formData.text.trim() &&
      formData.bgColor
    );
  }, [formData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM);
    setValidationErrors({});
  }, []);

  const handleInputChange = useCallback(
    (field: keyof BannerFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const handleEdit = useCallback((banner: PromoBanner) => {
    setEditingId(banner.id);
    setIsAdding(false);
    setFormData({
      title: banner.title,
      text: banner.text,
      bgColor: banner.bgColor,
      isActive: banner.isActive,
      links: banner.links?.length ? banner.links : [{ text: "", url: "" }],
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

  // ── Link helpers ─────────────────────────────────────────────────────────────

  const handleAddLink = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      links: [...prev.links, { text: "", url: "" }],
    }));
  }, []);

  const handleRemoveLink = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  }, []);

  const handleLinkChange = useCallback(
    (index: number, field: "text" | "url", value: string) => {
      setFormData((prev) => {
        const links = [...prev.links];
        links[index] = { ...links[index], [field]: value };
        return { ...prev, links };
      });
      setValidationErrors((prev) => ({
        ...prev,
        [`link_${field}_${index}`]: "",
      }));
    },
    [],
  );

  // ── API calls ─────────────────────────────────────────────────────────────────

  const buildPayload = (data: BannerFormData) => ({
    title: data.title.trim(),
    text: data.text.trim(),
    bgColor: data.bgColor,
    isActive: data.isActive,
    links: data.links
      .filter((l) => l.text.trim() && l.url.trim())
      .map(({ text, url }) => ({ text: text.trim(), url: url.trim() })),
  });

  const saveBanner = useCallback(
    async (id?: number) => {
      if (!validateForm()) {
        toast.error("Please fix the errors before saving");
        return;
      }
      setIsSaving(true);
      try {
        if (id) {
          console.log(formData, buildPayload(formData), "formData");
          const promoBanners = await axiosSecure.put(
            `/promo-banners/${id}`,
            buildPayload(formData),
          );

          console.log(promoBanners, "frontend");
          toast.success("Banner updated successfully");
          setEditingId(null);
        } else {
          await axiosSecure.post("/promo-banners", buildPayload(formData));
          toast.success("Banner created successfully");
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
    async (banner: PromoBanner) => {
      try {
        await axiosSecure.put(`/promo-banners/${banner.id}`, {
          isActive: !banner.isActive,
        });
        toast.success(
          `"${banner.title}" is now ${!banner.isActive ? "active" : "inactive"}`,
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
      await axiosSecure.delete(`/promo-banners/${deleteId}`);
      toast.success("Banner deleted");
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

  const sorted = [...(banners ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gray-50/50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon size={20} className="text-indigo-600" />
            Promo Banners
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage promotional banners and their links
          </p>
        </div>
        {!isAdding && (
          <button
            disabled={editingId !== null}
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Banner
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["", "Banner", "Text & Links", "Color", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap last:text-right"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {/* ── Add Row ── */}
            {isAdding && (
              <tr className="bg-indigo-50/40">
                <td className="px-3 py-4 text-gray-300">
                  <GripVertical size={18} />
                </td>
                <td className="px-5 py-4 align-top">
                  <TitleField
                    value={formData.title}
                    onChange={(v) => handleInputChange("title", v)}
                    error={validationErrors.title}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <TextAndLinksFields
                    formData={formData}
                    onTextChange={(v) => handleInputChange("text", v)}
                    onAddLink={handleAddLink}
                    onRemoveLink={handleRemoveLink}
                    onLinkChange={handleLinkChange}
                    errors={validationErrors}
                  />
                </td>
                <td className="px-5 py-4 align-top">
                  <ColorField
                    value={formData.bgColor}
                    onChange={(v) => handleInputChange("bgColor", v)}
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
                      onClick={() => saveBanner()}
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
            {sorted.map((banner: PromoBanner) => {
              const isEditing = editingId === banner.id;

              return (
                <tr
                  key={banner.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {/* Drag handle */}
                  <td className="px-3 py-4 text-gray-300 group-hover:text-gray-400 cursor-grab">
                    <GripVertical size={18} />
                  </td>

                  {/* Title */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <TitleField
                        value={formData.title}
                        onChange={(v) => handleInputChange("title", v)}
                        error={validationErrors.title}
                      />
                    ) : (
                      <div>
                        <p className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">
                          {banner.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          #{banner.id} · order {banner.order}
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Text & Links */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <TextAndLinksFields
                        formData={formData}
                        onTextChange={(v) => handleInputChange("text", v)}
                        onAddLink={handleAddLink}
                        onRemoveLink={handleRemoveLink}
                        onLinkChange={handleLinkChange}
                        errors={validationErrors}
                      />
                    ) : (
                      <div className="space-y-1.5 max-w-[260px]">
                        <p className="text-sm text-gray-700 truncate">
                          {banner.text}
                        </p>
                        {banner.links?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {banner.links.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors"
                              >
                                <ExternalLink size={10} />
                                {link.text}
                              </a>
                            ))}
                          </div>
                        )}
                        {(!banner.links || banner.links.length === 0) && (
                          <span className="text-xs text-gray-400 italic">
                            No links
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Color */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <ColorField
                        value={formData.bgColor}
                        onChange={(v) => handleInputChange("bgColor", v)}
                      />
                    ) : (
                      <ColorSwatch color={banner.bgColor} />
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
                        isActive={banner.isActive}
                        onToggle={() => toggleStatus(banner)}
                      />
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 align-top">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveBanner(banner.id)}
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
                        <button
                          onClick={() => handleEdit(banner)}
                          disabled={isAdding}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                          title="Edit banner"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteId(banner.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete banner"
                        >
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

      {/* Empty state */}
      {sorted.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No banners yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first promo banner to display on the homepage
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Add Banner
          </button>
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

// Title field
interface TitleFieldProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}
const TitleField: FC<TitleFieldProps> = ({ value, onChange, error }) => (
  <div className="space-y-1 min-w-40">
    <input
      type="text"
      placeholder="e.g. Summer Sale"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass(error)}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Banner text + links editor
interface TextAndLinksFieldsProps {
  formData: BannerFormData;
  onTextChange: (v: string) => void;
  onAddLink: () => void;
  onRemoveLink: (i: number) => void;
  onLinkChange: (i: number, field: "text" | "url", v: string) => void;
  errors: Record<string, string>;
}
const TextAndLinksFields: FC<TextAndLinksFieldsProps> = ({
  formData,
  onTextChange,
  onAddLink,
  onRemoveLink,
  onLinkChange,
  errors,
}) => (
  <div className="space-y-2 min-w-[260px]">
    {/* Banner text */}
    <div className="space-y-1">
      <input
        type="text"
        placeholder="Banner message text…"
        value={formData.text}
        onChange={(e) => onTextChange(e.target.value)}
        className={inputClass(errors.text)}
      />
      {errors.text && <p className="text-xs text-red-600">{errors.text}</p>}
    </div>

    {/* Links */}
    <div className="space-y-1.5">
      {formData.links.map((link, idx) => (
        <div key={idx} className="flex gap-1.5 items-start">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              placeholder="Link label"
              value={link.text}
              onChange={(e) => onLinkChange(idx, "text", e.target.value)}
              className={inputClass(errors[`link_text_${idx}`])}
            />
            {errors[`link_text_${idx}`] && (
              <p className="text-xs text-red-600">
                {errors[`link_text_${idx}`]}
              </p>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <input
              type="url"
              placeholder="https://…"
              value={link.url}
              onChange={(e) => onLinkChange(idx, "url", e.target.value)}
              className={inputClass(errors[`link_url_${idx}`])}
            />
            {errors[`link_url_${idx}`] && (
              <p className="text-xs text-red-600">
                {errors[`link_url_${idx}`]}
              </p>
            )}
          </div>
          {formData.links.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveLink(idx)}
              className="mt-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAddLink}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
      >
        <Plus size={12} />
        Add link
      </button>
    </div>
  </div>
);

// Color picker field
interface ColorFieldProps {
  value: string;
  onChange: (v: string) => void;
}
const ColorField: FC<ColorFieldProps> = ({ value, onChange }) => (
  <div className="flex items-center gap-2 min-w-[110px]">
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-10 border border-gray-300 rounded-lg cursor-pointer p-0.5"
    />
    <span className="text-xs text-gray-500 font-mono">{value}</span>
  </div>
);

// Color swatch (read-only)
const ColorSwatch: FC<{ color: string }> = ({ color }) => (
  <div className="flex items-center gap-2">
    <span
      className="w-7 h-7 rounded-md border border-gray-200 shadow-sm inline-block shrink-0"
      style={{ backgroundColor: color }}
    />
    <span className="text-xs text-gray-500 font-mono">{color}</span>
  </div>
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
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
      isActive
        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
    title="Click to toggle"
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        isActive ? "bg-emerald-500" : "bg-gray-400"
      }`}
    />
    {isActive ? "Active" : "Inactive"}
  </button>
);

export default AllPromoBannersComp;
