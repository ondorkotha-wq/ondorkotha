/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const EditProfile = ({ user, loading }: { user: any; loading: boolean }) => {
  const { user: userData, loading: userLoading, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    otp: "",
  });
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const axiosSecure = useAxiosSecure();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        otp: user.otp || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Initial Call to your @Put('update') endpoint
      if (!userLoading) {
        const response = await axiosSecure.put(`/users/update`, formData);

        // If backend says OTP is needed (Email/Phone change)
        if (response.data.status === "OTP_REQUIRED") {
          setShowOtp(true);
          // We don't show a success alert yet
        } else if (response.data.success) {
          localStorage.setItem("user", JSON.stringify(user));
          setUser(response.data.user);

          Swal.fire({
            title: "Profile Updated",
            text: "Your changes have been saved successfully.",
            icon: "success",
            confirmButtonColor: "#000",
            customClass: {
              title: "font-light uppercase tracking-widest",
              confirmButton:
                "rounded-none px-10 py-3 text-xs uppercase tracking-widest",
            },
          });
        }
      }
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update profile",
        "error",
      );
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    console.log(formData, "formData");
    e.preventDefault();

    try {
      if (!userLoading) {
        const res = await axiosSecure.put("/users/update", formData);

        console.log(res.data, "updateuser");

        setShowOtp(false);
        setOtpValue("");

        Swal.fire({
          title: "Verified",
          text: "Sensitive information updated successfully.",
          icon: "success",
          confirmButtonColor: "#000",
        });
      }
    } catch (err) {
      Swal.fire("Invalid OTP", "The code you entered is incorrect.", "error");
    }
  };

  const saveProfile = async (data: any) => {
    console.log("Saving to Ondorkotha DB:", data);
    // await api.updateProfile(data);
  };

  if (loading || userLoading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        {/* OTP Overlay - Add this inside your return() */}
        {showOtp && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
            <div className="bg-white p-10 max-w-sm w-full shadow-2xl rounded-sm border border-gray-100">
              <div className="text-center">
                <h3 className="text-sm font-bold uppercase tracking-[0.3em] mb-2">
                  Security Check
                </h3>
                <p className="text-[11px] text-gray-500 mb-8 leading-relaxed">
                  You are changing sensitive account information. Please enter
                  the 6-digit code sent to your device.
                </p>

                <input
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData({ ...formData, otp: e.target.value })
                  }
                  className="w-full border-b-2 border-black py-3 mb-8 text-center tracking-[1.2em] text-2xl font-light outline-none bg-transparent"
                  placeholder="000000"
                  autoFocus
                />

                <div className="space-y-3">
                  <button
                    onClick={handleVerifyOtp}
                    className="w-full bg-black text-white text-[10px] font-bold py-4 uppercase tracking-[0.2em] hover:bg-gray-800 transition"
                  >
                    Confirm Changes
                  </button>
                  <button
                    onClick={() => setShowOtp(false)}
                    className="w-full text-[10px] text-gray-400 uppercase tracking-widest py-2 hover:text-black transition"
                  >
                    I&apos;ll do this later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* header text  */}
        <header className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-2">
            Account Settings
          </h1>
          <p className="text-gray-500 text-sm">
            Manage your personal information.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">
              Personal Information
            </h2>

            <div className="group">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-all bg-transparent"
              />
            </div>

            <div className="group">
              <label className="text-xs font-medium text-gray-500 mb-1 flex justify-between">
                Email Address
                {formData.email !== user.email && (
                  <span className="text-[9px] text-amber-600 uppercase tracking-tighter">
                    Requires OTP
                  </span>
                )}
              </label>
              <input
                disabled
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-all bg-transparent disabled:bg-gray-200"
              />
            </div>

            <div className="group">
              <label className="text-xs font-medium text-gray-500 mb-1 flex justify-between">
                Phone Number
                {formData.phone !== user.phone && (
                  <span className="text-[9px] text-amber-600 uppercase tracking-tighter">
                    Requires OTP
                  </span>
                )}
              </label>
              <input
                disabled
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full py-3 border-b border-gray-200 focus:border-black outline-none transition-all bg-transparent disabled:bg-gray-200"
              />
            </div>
          </section>

          <button
            type="submit"
            className="cursor-pointer w-full sm:w-auto bg-black text-white px-12 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition active:scale-95"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
