"use client";

import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { toast } from "react-hot-toast";
import axios from "axios";
import useFetchVariants from "@/hooks/Attributes/useFetchVariants";

interface Variant {
  id: number;
  name: string;
}

const AddSize = () => {
  const axiosSecure = useAxiosSecure();

  const [formData, setFormData] = useState({
    name: "",
    variantId: "",
    sortOrder: 0,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  /* Fetch variants */
  const { variants, isLoading: isPending } = useFetchVariants({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;

    let checked = null;

    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      checked = e.target.checked;
      console.log(name, checked);
    } else {
      console.log(name, value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.variantId) {
      toast.error("Variant is required");
      return;
    }

    setIsLoading(true);

    try {
      await axiosSecure.post("/sizes", {
        ...formData,
        variantId: Number(formData.variantId),
      });

      toast.success("Size added successfully");
      setFormData({
        name: "",
        variantId: "",
        sortOrder: 0,
        isActive: true,
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { message?: string })?.message ||
            "Failed to add size",
        );
      } else {
        toast.error("Failed to add size");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add Size</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Size Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Size Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g. S, M, L, XL"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Variant */}
        <div>
          <label className="block text-sm font-medium mb-1">Variant</label>
          <select
            name="variantId"
            value={formData.variantId}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select variant</option>
            {variants?.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium mb-1">Sort Order</label>
          <input
            type="number"
            name="sortOrder"
            value={formData.sortOrder}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <span className="text-sm">Active</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          {isLoading ? "Adding..." : "Add Size"}
        </button>
      </form>
    </div>
  );
};

export default AddSize;
