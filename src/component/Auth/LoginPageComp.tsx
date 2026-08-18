"use client";
import AuthModal from "@/component/Auth/AuthModal";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const LoginPageComp = () => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect") || "/";

    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0] px-4">
      <AuthModal isOpen={isOpen} onClose={handleClose}></AuthModal>
    </div>
  );
};

export default LoginPageComp;
