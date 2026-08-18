/* eslint-disable @next/next/no-img-element */
"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiUpload, FiX, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import axios from "axios";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import useFetchASeries from "@/hooks/Categories/Series/useFetchASeries";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";

interface SeriesFormData {
  name: string;
  slug: string;
  image: File | null;
  notice: string;
  isActive: boolean;
  sortOrder: number;
}

const AddOrUpdateSeriesComp = () => {
  const { slug }: { slug: string } = useParams();

  const isUpdateMode = !!slug;

  const { seriesData, isLoading: isProductLoading } = useFetchASeries({
    seriesSlug: slug,
  });

  const [formData, setFormData] = useState<SeriesFormData>({
    name: "",
    slug: "",
    image: null, // Initialized as null
    notice: "",
    isActive: true,
    sortOrder: 0,
  });

  // pre define values if available
  useEffect(() => {
    if (seriesData && slug) {
      setFormData({
        name: seriesData.name || "",
        slug: seriesData.slug || "",
        image: null, // keep null, because backend image is string URL
        notice: seriesData.notice || "",
        isActive: seriesData.isActive ?? true,
        sortOrder: seriesData.sortOrder ?? 0,
      });

      // show existing image preview
      if (seriesData.image) {
        setImagePreview(seriesData.image);
      }
    }
  }, [seriesData, slug]);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
  };

  // Name change
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    setFormData((prev) => ({
      ...prev,
      name,
      slug: isUpdateMode ? prev.slug : generateSlug(name),
    }));
  };

  // Slug change
  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    const slug = generateSlug(e.target.value);
    setFormData((prev) => ({ ...prev, slug }));
  };

  // handle image upload / change / update
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Update formData with the actual FILE object
    setFormData((prev) => ({ ...prev, image: file }));

    // Create local preview URL (Better than Base64 for performance)
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // remove image
  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const axiosSecure = useAxiosSecure();

  // handle submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = seriesData?.image || "";

      // Upload only if new file selected
      if (formData.image) {
        imageUrl = await handleUploadWithCloudinary(formData.image);
      }

      const finalData = {
        name: formData.name,
        slug: formData.slug,
        image: imageUrl,
        notice: formData.notice,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      if (!finalData.name.trim()) {
        toast.error("Series name is required");
        setIsLoading(false);
        return;
      }

      if (slug) {
        // UPDATE
        await axiosSecure.patch(`/series/${slug}`, finalData);
        toast.success("Series updated successfully!");
      } else {
        // CREATE
        await axiosSecure.post("/series", finalData);
        toast.success("Series created successfully!");
      }

      setTimeout(() => {
        router.push("/admin/series/all");
      }, 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMsg =
          (err.response?.data as { message?: string })?.message ||
          "Operation failed.";
        toast.error(errorMsg);
        setError(errorMsg);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Operation failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      slug: "",
      image: null,
      notice: "",
      isActive: true,
      sortOrder: 0,
    });
    setImagePreview(null);
    toast.success("Form reset");
  };

  if (slug && isProductLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {slug ? "Update Series" : "Add New Series"}
              </h1>

              <p className="text-gray-600 mt-1">
                {slug
                  ? "Update furniture series for your catalog"
                  : "Create a new furniture series for your catalog"}
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/series")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Series
            </button>
          </div>
        </div>

        {/* form of adding series  */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                Basic Information
              </h2>

              {/* Series Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Series Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="e.g., Living Room Collection"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  The name of your furniture series as it will appear on the
                  website
                </p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">ondorkotha.com/series/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    disabled={isUpdateMode}
                    className={`flex-1 px-4 py-2 border rounded-lg outline-none transition ${
                      isUpdateMode
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    required
                  />
                </div>
                {!isUpdateMode && (
                  <p className="mt-1 text-sm text-gray-500">
                    URL-friendly version of the name. Auto-generated from series
                    name
                  </p>
                )}
              </div>

              {/* Notice/Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notice / Description
                </label>
                <input
                  type="text"
                  value={formData.notice}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notice: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="e.g., Top-selling series, Modern collection"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Short description or tagline for this series
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                Series Image
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Series Thumbnail
                </label>

                {/* image preview and upload */}
                {imagePreview ? (
                  <div className="relative">
                    <div className="w-64 h-48 rounded-lg overflow-hidden border border-gray-300">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-64 h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload Image</p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
                Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.isActive}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, isActive: true }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.isActive}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, isActive: false }))
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Inactive</span>
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Active series will be visible on the website
                  </p>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Lower numbers appear first in listings
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Preview
              </h3>
              <div className="bg-white rounded-lg border border-gray-300 overflow-hidden max-w-md">
                {imagePreview && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Series preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {formData.name || "Series Name"}
                      </h4>
                      {formData.notice && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formData.notice}
                        </p>
                      )}
                    </div>
                    {formData.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>Slug: {formData.slug || "series-slug"}</p>
                    <p>Order: {formData.sortOrder}</p>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/series")}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{slug ? "Updating..." : "Creating..."}</span>
                  </>
                ) : (
                  <>
                    <FiSave className="text-base" />
                    <span>{slug ? "Update Series" : "Create Series"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Tips {!slug && "for creating a series"}:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use descriptive names that customers will understand</li>
            <li>• Upload high-quality images that showcase the series style</li>
            <li>• The notice/tagline should highlight key selling points</li>
            <li>• Set appropriate sort order based on importance/popularity</li>
            <li>• You can add categories to this series after creation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddOrUpdateSeriesComp;
