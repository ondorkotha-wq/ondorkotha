/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasRequiredRole, isAuthenticated } from "@/utils/auth";
import LoadingDots from "./Loading/LoadingDS";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  route?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  route,
  redirectTo = "/unauthorized",
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  // console.log(pathname, "usePathname");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Snapshotted once from the prop (not read directly in the effect below)
  // since callers pass allowedRoles as an inline array literal — a fresh
  // reference every render would re-trigger the effect on every render.
  const [allAllowedRoles] = useState([...allowedRoles]);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);

      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      // If no specific roles required, just check authentication
      if (allAllowedRoles.length === 0) {
        console.log("length 0", allAllowedRoles);
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Check if user has required role
      if (!hasRequiredRole(allAllowedRoles)) {
        // console.log("reject");
        router.push(redirectTo);
        return;
      }

      // console.log("yee");
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, allAllowedRoles, redirectTo, pathname]);

  isLoading && <LoadingDots></LoadingDots>;

  return <>{isAuthorized && children}</>;
}
