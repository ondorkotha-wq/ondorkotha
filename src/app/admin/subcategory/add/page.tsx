/* eslint-disable @next/next/no-img-element */
"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUpload, FiX, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import axios from "axios";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";

interface Category {
  id: number;
  name: string;
}

interface SubCategoryFormData {
  name: string;
  slug: string;
  image: File | null;
  sortOrder: number;
  isActive: boolean;
  seriesId: number | "";
  categoryId: number | "";
}

const AddSubcategory = () => {
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();

  const [isLoading, setIsLoading] = useState(false);
  // const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { seriesList } = useFetchSeries({
    isActive: true,
  });

  const [formData, setFormData] = useState<SubCategoryFormData>({
    name: "",
    slug: "",
    image: null,
    sortOrder: 0,
    isActive: true,
    seriesId: "",
    categoryId: "",
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
  // Fetch Categories when Series changes
  // -------------------------
  useEffect(() => {
    if (!formData.seriesId) {
      setCategoryList([]);
      setFormData((prev) => ({ ...prev, categoryId: "" }));
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await axiosPublic.get(
          `/series/${formData.seriesId}/categories`
        );
        setCategoryList(res.data);
      } catch {
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, [formData.seriesId, axiosPublic]);

  // -------------------------
  // Handlers
  // -------------------------
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
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

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!formData.slug) {
      toast.error("Slug is required");
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = "";

      if (formData.image) {
        imageUrl = await handleUploadWithCloudinary(formData.image);
      }

      await axiosSecure.post("/subcategory", {
        name: formData.name,
        slug: formData.slug,
        image: imageUrl,
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        categoryId: formData.categoryId,
      });

      toast.success("Subcategory created successfully");
      setTimeout(() => router.push("/admin/subcategory/all"), 1200);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { message?: string })?.message ||
            "Failed to create subcategory"
        );
      } else {
        toast.error("Failed to create subcategory");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Add New Subcategory</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Series */}
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
          >
            <option value="">-- Select Series --</option>
            {seriesList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Category *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                categoryId: Number(e.target.value),
              }))
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            disabled={!formData.seriesId}
          >
            <option value="">-- Select Category --</option>
            {categoryList?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Subcategory Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            placeholder="e.g. Recliner Sofa"
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
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            required
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Subcategory Image
          </label>
          {imagePreview ? (
            <div className="relative w-48 h-36">
              <img
                src={imagePreview}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
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
            <label className="flex items-center justify-center w-48 h-36 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer">
              <FiUpload className="text-gray-400" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        {/* Settings */}
        <div className="flex gap-6">
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
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg"
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

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push("/admin/subcategory/all")}
            className="px-5 py-2 border border-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <FiSave />
            {isLoading ? "Creating..." : "Create Subcategory"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubcategory;
