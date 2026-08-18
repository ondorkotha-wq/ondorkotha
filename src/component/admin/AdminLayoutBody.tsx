"use client";

import { useAdminDrawer } from "@/context/AdminContext";
import AdminDrawer from "@/component/Headers/AdminDrawerTS";
import AdminHeader from "@/component/Headers/AdminHeader";
import RoutePermissionGuard from "@/component/admin/auth/RoutePermissionGuard";

export default function AdminLayoutBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdminOpen } = useAdminDrawer();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDrawer />
      <div
        className={`transition-all duration-300 ${
          isAdminOpen ? "md:pl-64" : "md:pl-20"
        }`}
      >
        <AdminHeader />
        <main className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <RoutePermissionGuard>{children}</RoutePermissionGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
