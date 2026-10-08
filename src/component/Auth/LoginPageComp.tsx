"use client";
import AuthModal from "@/component/Auth/AuthModal";
import { isAuthenticated } from "@/utils/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

// Pages that bounce signed-out visitors straight back to /login — closing the
// modal without signing in must not send them there, or it reopens instantly.
const SIGNED_IN_ONLY_PATHS = ["/dashboard"];

const LoginPageComp = () => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    const urlParams = new URLSearchParams(window.location.search);
    let redirect = urlParams.get("redirect") || "/";

    if (
      !isAuthenticated() &&
      SIGNED_IN_ONLY_PATHS.some(
        (path) => redirect === path || redirect.startsWith(`${path}/`),
      )
    ) {
      redirect = "/";
    }

    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0] px-4">
      <AuthModal isOpen={isOpen} onClose={handleClose}></AuthModal>
    </div>
  );
};

export default LoginPageComp;
