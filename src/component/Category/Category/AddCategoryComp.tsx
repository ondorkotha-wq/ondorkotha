/* eslint-disable @next/next/no-img-element */
"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import axios from "axios";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import useFetchACategory from "@/hooks/Categories/Categories/useFetchACategory";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";
import { EntityFormLayout } from "../EntityFormLayout";

interface CategoryFormData {
  name: string;
  slug: string;
  image: File | null;
  sortOrder: number;
  isActive: boolean;
  seriesId: number | "";
}

const AddOrUpdateCategoryComp = () => {
  const { slug }: { slug: string } = useParams();

  const isUpdateMode = !!slug;

  const { categoryData, isLoading: isProductLoading } = useFetchACategory({
    categorySlug: slug,
  });

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    image: null,
    sortOrder: 0,
    isActive: true,
    seriesId: "",
  });

  // pre define values if available
  useEffect(() => {
    if (categoryData && slug) {
      setFormData({
        name: categoryData.name || "",
        slug: categoryData.slug || "",
        image: null, // keep null, because backend image is string URL
        // notice: categoryData.notice || "",
        isActive: categoryData.isActive ?? true,
        sortOrder: categoryData.sortOrder ?? 0,
        seriesId: categoryData.seriesId,
      });

      // show existing image preview
      if (categoryData.image) {
        setImagePreview(categoryData.image);
      }
    }
  }, [categoryData, slug]);

  const router = useRouter();
  const axiosSecure = useAxiosSecure();

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { seriesList } = useFetchSeries({
    isActive: true,
  });

  // -------------------------
  // Utils
  // -------------------------
  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();

  // -------------------------
  // Handlers
  // -------------------------
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    setFormData((prev) => ({
      ...prev,
      name,
      slug: isUpdateMode ? prev.slug : generateSlug(name),
    }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  // -------------------------
  // Submit
  // -------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.seriesId) {
      toast.error("Please select a series");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = categoryData?.image || "";

      // Upload only if new file selected
      if (formData.image) {
        imageUrl = await handleUploadWithCloudinary(formData.image);
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        image: imageUrl,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        seriesId: formData.seriesId,
      };

      if (isUpdateMode) {
        await axiosSecure.patch(`/category/${slug}`, payload);
        toast.success("Category updated successfully");
      } else {
        await axiosSecure.post("/category", payload);
        toast.success("Category created successfully");
      }

      setTimeout(() => {
        router.push("/admin/category/all");
      }, 1200);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { message?: string })?.message ||
            "Operation failed",
        );
      } else {
        toast.error("Operation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (slug && isProductLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <EntityFormLayout
      title={slug ? "Update Category" : "Add New Category"}
      description={
        slug ? "Update furniture category" : "Create a new furniture category"
      }
      backPath="/admin/categories"
      isLoading={isLoading}
      isDataFetching={slug ? isProductLoading : false}
      onSubmit={handleSubmit}
      onReset={() => {
        setFormData({
          name: "",
          slug: "",
          image: null,
          sortOrder: 0,
          isActive: true,
          seriesId: "",
        });
        setImagePreview(null);
      }}
      submitLabel={slug ? "Update Category" : "Create Category"}
      previewCard={
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-md">
          {imagePreview && (
            <div className="h-40 overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">
                  {formData.name || "Category Name"}
                </h4>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  formData.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {formData.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Slug: {formData.slug || "category-slug"}</p>
              <p>Order: {formData.sortOrder}</p>
            </div>
          </div>
        </div>
      }
    >
      {/* Series Dropdown */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Series *
        </label>
        <select
          value={formData.seriesId}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              seriesId: Number(e.target.value),
            }))
          }
          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          required
        >
          <option value="">-- Select Series --</option>
          {seriesList?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Category Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-2">Slug *</label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              slug: generateSlug(e.target.value),
            }))
          }
          disabled={isUpdateMode}
          className={`w-full px-4 py-2 border rounded-lg ${
            isUpdateMode
              ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
              : "border-gray-200"
          }`}
          required
        />
        {isUpdateMode && formData.slug && (
          <Link
            href={`/admin/cms/seo?url=${encodeURIComponent(`/categories/${formData.slug}`)}`}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <Search size={12} />
            Manage SEO for this page
          </Link>
        )}
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium mb-2">Category Image</label>

        {imagePreview ? (
          <div className="relative w-64 h-40">
            <img
              src={imagePreview}
              className="w-full h-full object-cover rounded-lg border"
              alt="Preview"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
            >
              <FiX />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-64 h-40 border-2 border-dashed rounded-lg relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FiUpload className="text-gray-400 text-2xl" />
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Sort Order</label>
          <input
            type="number"
            value={formData.sortOrder}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sortOrder: Number(e.target.value) || 0,
              }))
            }
            className="w-32 px-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={formData.isActive ? "1" : "0"}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isActive: e.target.value === "1",
              }))
            }
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>
    </EntityFormLayout>
  );
};

export default AddOrUpdateCategoryComp;
