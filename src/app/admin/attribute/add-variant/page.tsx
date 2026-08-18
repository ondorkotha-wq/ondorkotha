"use client";

import React, { useState, FormEvent } from "react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { toast } from "react-hot-toast";
import axios from "axios";

const AddVariant = () => {
  const axiosSecure = useAxiosSecure();
  const [formData, setFormData] = useState({
    name: "",
    sortOrder: 0,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    setIsLoading(true);

    try {
      await axiosSecure.post("/variants", formData);
      toast.success("Variant added successfully");
      setFormData({ name: "", sortOrder: 0, isActive: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { message?: string })?.message ||
            "Failed to add variant"
        );
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to add variant");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add Variant</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Variant Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Cotton, Polyester"
          />
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
          {isLoading ? "Adding..." : "Add Variant"}
        </button>
      </form>
    </div>
  );
};

export default AddVariant;
