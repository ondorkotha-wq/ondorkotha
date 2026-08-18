"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAllowedRole = (role: string) =>
    role === "ORDERMANAGER" ||
    role === "SUPERADMIN" ||
    role === "PRODUCTMANAGER" ||
    role === "INVENTORYMANAGER" ||
    role === "SUPPORT";

  useEffect(() => {
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    if (!isAllowedRole(user.role)) {
      router.replace("/");
    }
  }, [user, router, loading]);

  if (!user || !isAllowedRole(user.role)) return null;

  return <>{children}</>;
}
