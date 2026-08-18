"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminDrawerContextType {
  isAdminOpen: boolean;
  toggleAdminDrawer: () => void;
  isMobile: boolean;
}

const AdminDrawerContext = createContext<AdminDrawerContextType | undefined>(
  undefined,
);

export function AdminDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsAdminOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleAdminDrawer = () => {
    setIsAdminOpen((prev) => !prev);
  };

  return (
    <AdminDrawerContext.Provider
      value={{ isAdminOpen, toggleAdminDrawer, isMobile }}
    >
      {children}
    </AdminDrawerContext.Provider>
  );
}

export function useAdminDrawer() {
  const context = useContext(AdminDrawerContext);
  if (context === undefined) {
    throw new Error(
      "useAdminDrawer must be used within an AdminDrawerProvider",
    );
  }
  return context;
}
