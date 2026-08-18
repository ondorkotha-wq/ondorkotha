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
  Image as ImageIcon,
  Upload,
  Monitor,
  Smartphone,
  Layers,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { DeleteConfirmationModal } from "../../Modal/DeleteConfirmationModal";
import useFetchHomepageBanners from "@/hooks/Homepage/Banner/useFetchHomepageBanners";

// Types
export interface Banner {
  id: number;
  title: string;
  image: string;
  link?: string | null;
  device?: "DESKTOP" | "MOBILE" | null;
  active: boolean;
}

interface BannerFormData {
  title: string;
  image: File | string | null;
  link: string;
  device: "DESKTOP" | "MOBILE" | "";
  active: boolean;
}

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

const DEVICE_OPTIONS = [
  { value: "DESKTOP", label: "Desktop", icon: Monitor },
  { value: "MOBILE", label: "Mobile", icon: Smartphone },
  { value: "", label: "Both", icon: Layers },
] as const;

const DEFAULT_FORM_DATA: BannerFormData = {
  title: "",
  image: null,
  link: "",
  device: "DESKTOP",
  active: true,
};

const AllBannersComp: React.FC = () => {
  const axiosSecure = useAxiosSecure();
  const { banners, isLoading, refetch } = useFetchHomepageBanners(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM_DATA);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const isFormValid = useMemo(() => {
    return formData.title.trim().length > 0 && formData.image !== null;
  }, [formData.title, formData.image]);

  // Quick toggle active status
  const toggleStatusQuickly = useCallback(
    async (banner: Banner) => {
      setIsUploading(true);
      try {
        await axiosSecure.put(`/homepage-banners/${banner.id}`, {
          active: !banner.active,
        });
        toast.success(
          `"${banner.title}" is now ${!banner.active ? "Active" : "Inactive"}`,
        );
        await refetch();
      } catch {
        toast.error("Failed to update status");
      } finally {
        setIsUploading(false);
      }
    },
    [axiosSecure, refetch],
  );

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setImagePreview(null);
    setValidationErrors({});
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    },
    [],
  );

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Banner title is required";
    }
    if (!formData.image) {
      errors.image = "Banner image is required";
    }
    if (formData.link && !/^https?:\/\/.+/.test(formData.link)) {
      errors.link = "Link must start with http:// or https://";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.title, formData.image, formData.link]);

  const handleEdit = useCallback((banner: Banner) => {
    setEditingId(banner.id);
    setIsAdding(false);
    setFormData({
      title: banner.title,
      image: banner.image,
      link: banner.link || "",
      device: (banner.device as BannerFormData["device"]) ?? "DESKTOP",
      active: banner.active,
    });
    setImagePreview(banner.image || null);
    setValidationErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  }, [resetForm]);

  const handleInputChange = useCallback(
    (field: keyof BannerFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    },
    [],
  );

  const saveBanner = useCallback(
    async (id?: number) => {
      if (!validateForm()) {
        toast.error("Please fix validation errors");
        return;
      }

      setIsUploading(true);

      try {
        let imageUrl = formData.image;

        if (formData.image instanceof File) {
          imageUrl = await handleUploadWithCloudinary(formData.image);
        }

        const payload = {
          title: formData.title,
          image: imageUrl as string,
          link: formData.link || null,
          device: formData.device || null,
          active: formData.active,
        };

        if (id) {
          await axiosSecure.put(`/homepage-banners/${id}`, payload);
          toast.success("Banner updated successfully");
          setEditingId(null);
        } else {
          await axiosSecure.post("/homepage-banners", payload);
          toast.success("Banner added successfully");
          setIsAdding(false);
        }

        resetForm();
        await refetch();
      } catch (error: any) {
        const apiError = error as ApiError;
        toast.error(
          apiError?.response?.data?.message || error?.message || "Operation failed",
        );
        console.error("Error saving banner:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [axiosSecure, formData, refetch, resetForm, validateForm],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await axiosSecure.delete(`/homepage-banners/${deleteId}`);
      toast.success("Banner deleted successfully");
      setDeleteId(null);
      await refetch();
    } catch (error: any) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }, [axiosSecure, deleteId, refetch]);

  const handleAddNew = useCallback(() => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  }, [resetForm]);

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
            <ImageIcon size={20} className="text-indigo-600" />
            Banner Library
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage homepage banners for desktop and mobile
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
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Preview
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Banner Info
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Device
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {/* Add new row */}
            {isAdding && (
              <tr className="bg-indigo-50/50">
                <td className="px-6 py-4">
                  <BannerImageUpload
                    imagePreview={imagePreview}
                    onImageChange={handleImageChange}
                    onImageRemove={removeImage}
                    error={validationErrors.image}
                  />
                </td>
                <td className="px-6 py-4 min-w-[220px]">
                  <BannerInfoForm
                    title={formData.title}
                    link={formData.link}
                    onTitleChange={(v) => handleInputChange("title", v)}
                    onLinkChange={(v) => handleInputChange("link", v)}
                    titleError={validationErrors.title}
                    linkError={validationErrors.link}
                  />
                </td>
                <td className="px-6 py-4">
                  <DeviceSelector
                    value={formData.device}
                    onChange={(v) => handleInputChange("device", v)}
                  />
                </td>
                <td className="px-6 py-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        handleInputChange("active", e.target.checked)
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Active</span>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => saveBanner()}
                      disabled={!isFormValid || isUploading}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Saving..." : "Save"}
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

            {/* Existing banners */}
            {banners?.map((banner: Banner) => {
              const isEditing = editingId === banner.id;
              return (
                <tr
                  key={banner.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Preview */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <BannerImageUpload
                        imagePreview={imagePreview}
                        onImageChange={handleImageChange}
                        onImageRemove={removeImage}
                        error={validationErrors.image}
                      />
                    ) : (
                      <BannerThumbnail banner={banner} />
                    )}
                  </td>

                  {/* Info */}
                  <td className="px-6 py-4 min-w-[220px]">
                    {isEditing ? (
                      <BannerInfoForm
                        title={formData.title}
                        link={formData.link}
                        onTitleChange={(v) => handleInputChange("title", v)}
                        onLinkChange={(v) => handleInputChange("link", v)}
                        titleError={validationErrors.title}
                        linkError={validationErrors.link}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {banner.title}
                        </div>
                        {banner.link ? (
                          <a
                            href={banner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-0.5 truncate max-w-[200px]"
                          >
                            <ExternalLink size={11} />
                            {banner.link}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 mt-0.5 block">
                            No link
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Device */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <DeviceSelector
                        value={formData.device}
                        onChange={(v) => handleInputChange("device", v)}
                      />
                    ) : (
                      <DeviceBadge device={banner.device} />
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) =>
                            handleInputChange("active", e.target.checked)
                          }
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                          {formData.active ? "Active" : "Inactive"}
                        </span>
                      </label>
                    ) : (
                      <StatusBadge
                        isActive={banner.active}
                        onToggle={() => toggleStatusQuickly(banner)}
                        isPending={isUploading}
                      />
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveBanner(banner.id)}
                          disabled={!isFormValid || isUploading}
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
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
      {banners?.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No banners yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Get started by adding your first homepage banner
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

      {/* Delete Confirmation Modal */}
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

// ─── Sub-components ──────────────────────────────────────────────────────────

interface BannerThumbnailProps {
  banner: Banner;
}

const BannerThumbnail: React.FC<BannerThumbnailProps> = ({ banner }) => (
  <div className="w-24 h-14 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
    {banner.image ? (
      <img
        src={banner.image}
        alt={banner.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      <ImageIcon size={20} className="text-gray-400" />
    )}
  </div>
);

interface BannerImageUploadProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  error?: string;
}

const BannerImageUpload: React.FC<BannerImageUploadProps> = ({
  imagePreview,
  onImageChange,
  onImageRemove,
  error,
}) => (
  <div className="flex flex-col gap-1">
    {imagePreview ? (
      <div className="relative w-24 h-14 border rounded-lg overflow-hidden group">
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
        className={`relative w-24 h-14 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors group ${
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
          className={`${error ? "text-red-400" : "text-gray-400 group-hover:text-indigo-500"}`}
        />
        <span
          className={`text-[10px] mt-1 ${error ? "text-red-400" : "text-gray-400 group-hover:text-indigo-500"}`}
        >
          Upload
        </span>
      </label>
    )}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

interface BannerInfoFormProps {
  title: string;
  link: string;
  onTitleChange: (v: string) => void;
  onLinkChange: (v: string) => void;
  titleError?: string;
  linkError?: string;
}

const BannerInfoForm: React.FC<BannerInfoFormProps> = ({
  title,
  link,
  onTitleChange,
  onLinkChange,
  titleError,
  linkError,
}) => (
  <div className="space-y-2">
    <div>
      <input
        type="text"
        placeholder="Banner title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className={`block w-full text-sm border rounded-lg px-3 py-2 ${
          titleError ? "border-red-500" : "border-gray-300"
        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
      />
      {titleError && (
        <p className="text-xs text-red-600 mt-0.5">{titleError}</p>
      )}
    </div>
    <div>
      <input
        type="url"
        placeholder="https://example.com (optional)"
        value={link}
        onChange={(e) => onLinkChange(e.target.value)}
        className={`block w-full text-xs border rounded-lg px-3 py-2 ${
          linkError ? "border-red-500" : "border-gray-300"
        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
      />
      {linkError && <p className="text-xs text-red-600 mt-0.5">{linkError}</p>}
    </div>
  </div>
);

interface DeviceSelectorProps {
  value: BannerFormData["device"];
  onChange: (v: BannerFormData["device"]) => void;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ value, onChange }) => (
  <div className="flex flex-col gap-1">
    {DEVICE_OPTIONS.map(({ value: val, label, icon: Icon }) => (
      <label key={val} className="flex items-center gap-2 cursor-pointer group">
        <input
          type="radio"
          name="device-selector"
          value={val}
          checked={value === val}
          onChange={() => onChange(val as BannerFormData["device"])}
          className="text-indigo-600 focus:ring-indigo-500"
        />
        <Icon size={13} className="text-gray-500" />
        <span className="text-xs text-gray-600 group-hover:text-gray-900">
          {label}
        </span>
      </label>
    ))}
  </div>
);

interface DeviceBadgeProps {
  device?: "DESKTOP" | "MOBILE" | null;
}

const DeviceBadge: React.FC<DeviceBadgeProps> = ({ device }) => {
  const config = {
    DESKTOP: {
      icon: Monitor,
      label: "Desktop",
      className: "bg-blue-50 text-blue-700",
    },
    MOBILE: {
      icon: Smartphone,
      label: "Mobile",
      className: "bg-purple-50 text-purple-700",
    },
    null: {
      icon: Layers,
      label: "Both",
      className: "bg-gray-100 text-gray-600",
    },
  };

  const key = device ?? "null";
  const { icon: Icon, label, className } = (config as any)[key] ?? config.null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
};

interface StatusBadgeProps {
  isActive: boolean;
  onToggle?: () => void;
  isPending?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive,
  onToggle,
  isPending,
}) => (
  <button
    onClick={onToggle}
    disabled={isPending}
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
      isActive
        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
    title="Click to toggle status"
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500" : "bg-gray-400"}`}
    />
    {isActive ? "Active" : "Inactive"}
  </button>
);

export default AllBannersComp;
