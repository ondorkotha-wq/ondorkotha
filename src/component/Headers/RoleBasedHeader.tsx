"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "./Header";

const RoleBasedHeader = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/admin");
  const isAdmin = user?.role !== "CUSTOMER" && isAdminRoute;

  // For admin routes, return the complete admin layout components
  if (isAdmin) {
    return null;
  }

  // For non-admin routes, return the regular header
  return <Header />;
};

export default RoleBasedHeader;
