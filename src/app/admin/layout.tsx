import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import ProtectedRoute from "@/component/ProtectedRoute";
import AdminGuard from "@/component/admin/auth/AdminGuard";
import { AdminDrawerProvider } from "@/context/AdminContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import AdminLayoutBody from "@/component/admin/AdminLayoutBody";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ondorkotha Admin Pro",
  description: "Premium Furniture Marketplace Administration",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-sans antialiased`}>
      <Providers>
        <ProtectedRoute>
          <AdminGuard>
            <PermissionsProvider>
              <AdminDrawerProvider>
                <AdminLayoutBody>{children}</AdminLayoutBody>
              </AdminDrawerProvider>
            </PermissionsProvider>
          </AdminGuard>
        </ProtectedRoute>
      </Providers>
    </div>
  );
}
