"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Footer from "../Footer/Footer";

const RoleBasedFooter = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {user && user.role != "CUSTOMER" && isAdmin ? (
        null
      ) : (
        <Footer />
      )}
    </>
  );
};

export default RoleBasedFooter;
