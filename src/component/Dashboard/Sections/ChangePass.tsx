/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import React, { useState } from "react";
import Swal from "sweetalert2";

const ChangePass = ({ user, loading }: { user: any; loading: boolean }) => {
  const axiosSecure = useAxiosSecure();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const res = await axiosSecure.put("/auth/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      Swal.fire({
        title: "Password Updated",
        text: "Your password has been changed successfully.",
        icon: "success",
        confirmButtonColor: "#000",
      });

      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      console.error(err.response?.data?.message);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to change password",
        "error",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-md">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        Change Password
      </h2>

      <input
        type="password"
        name="oldPassword"
        placeholder="Current Password"
        value={formData.oldPassword}
        onChange={handleChange}
        className="w-full py-3 border-b border-gray-200 outline-none"
        required
      />

      <input
        type="password"
        name="newPassword"
        placeholder="New Password"
        value={formData.newPassword}
        onChange={handleChange}
        className="w-full py-3 border-b border-gray-200 outline-none"
        required
      />

      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirm New Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        className="w-full py-3 border-b border-gray-200 outline-none"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        className="bg-black text-white px-10 py-4 text-xs uppercase tracking-widest hover:bg-gray-800 transition"
      >
        Update Password
      </button>
    </form>
  );
};

export default ChangePass;
