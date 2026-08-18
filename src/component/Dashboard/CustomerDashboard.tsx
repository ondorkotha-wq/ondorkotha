/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  X,
  User,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  Home,
  HelpingHand,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAuthenticated } from "@/utils/auth";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingDots from "../Loading/LoadingDS";
import { FullScreenCenter } from "../Screen/FullScreenCenter";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { toast } from "react-hot-toast";
import useOrders, { GetAllOrdersOptions } from "@/hooks/Order/useOrders";
import OverviewSection from "./Sections/OverviewSection";
import OrdersSection from "./Sections/OrderSection";
import { devLog } from "@/utils/devlog";
import Link from "next/link";
import Track from "./Sections/Track";
import EditProfile from "./Sections/EditProfile";
import ChangePass from "./Sections/ChangePass";
import Support from "./Sections/Support";
import Tickets from "./Sections/Tickets";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  {
    id: "orders",
    label: "Order History",
    icon: <Package className="w-5 h-5" />,
  },
  { id: "track", label: "Track Order", icon: <Search className="w-5 h-5" /> },
  { id: "profile", label: "Edit Profile", icon: <User className="w-5 h-5" /> },
  {
    id: "password",
    label: "Change Password",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    id: "support",
    label: "Help & Support",
    icon: <HelpingHand className="w-5 h-5" />,
  },
  {
    id: "tickets",
    label: "Open Tickets",
    icon: <Ticket className="w-5 h-5" />,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return "text-green-600 bg-green-50";
    case "SHIPPED":
      return "text-blue-600 bg-blue-50";
    case "PENDING":
      return "text-amber-600 bg-amber-50";
    case "CANCELLED":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return <CheckCircle2 className="w-4 h-4" />;
    case "SHIPPED":
      return <Truck className="w-4 h-4" />;
    case "PENDING":
      return <Clock className="w-4 h-4" />;
    case "CANCELLED":
      return <XCircle className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

// Reusable Sidebar Button
const SidebarButton = ({
  item,
  activeItem,
  // onClick,
}: {
  item: NavItem;
  activeItem: string;
  // onClick: (id: string) => void;
}) => (
  <Link
    href={`/dashboard?activeItem=${item.id}`}
    // onClick={() => onClick(item.id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition text-sm ${
      activeItem === item.id
        ? "bg-gray-900 text-white"
        : "hover:bg-gray-50 text-gray-700"
    }`}
  >
    {item.icon} <span className="font-medium">{item.label}</span>
  </Link>
);

const CustomerDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();

  console.log(user);

  const axiosSecure = useAxiosSecure();

  const [orderOptions, setOrderOptions] = useState<GetAllOrdersOptions>({
    thumb: true,
    page: 1,
  });

  const { orders, refetch } = useOrders(orderOptions);

  // devLog(orders, "orderss");

  const [activeItem, setActiveItem] = useState("overview");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({ name: "", phone: "" });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Sync activeItem with URL
  useEffect(() => {
    const param = searchParams.get("activeItem");
    if (param) setActiveItem(param);
  }, [searchParams]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !isAuthenticated())
      router.push("/login?redirect=/dashboard");
  }, [loading, router]);

  // Populate profile form when user loads
  useEffect(() => {
    if (user)
      setProfileData({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  if (loading)
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );

  if (!user) return <FullScreenCenter>User not found</FullScreenCenter>;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axiosSecure.put("/customer/profile", profileData);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword)
      return toast.error("Passwords do not match");
    if (passwordData.newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");

    setIsLoading(true);
    try {
      await axiosSecure.post("/customer/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            {isDrawerOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <span className="font-light text-xl">My Account</span>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name || "Guest"}</p>
              <p className="text-xs text-gray-500">{user.phone || ""}</p>
            </div>
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {(user.name || "G")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16 p-6">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarButton
                key={item.id}
                item={item}
                activeItem={activeItem}
                // onClick={setActiveItem}
              />
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 mt-8 px-4 py-3 rounded-md hover:bg-red-50 transition text-red-600 text-sm"
          >
            <LogOut className="w-5 h-5" />{" "}
            <span className="font-medium">Sign Out</span>
          </button>
        </aside>

        {/* Mobile Drawer */}
        {isDrawerOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
        <aside
          className={`lg:hidden fixed top-0 left-0 w-80 h-full bg-white z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-light text-xl">My Account</span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-gray-50 flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-xl">
                {(user.name || "G")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-medium text-lg">{user.name}</h2>
                <p className="text-sm text-gray-600">{user.phone}</p>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {navigationItems.map((item) => (
                <SidebarButton
                  key={item.id}
                  item={item}
                  activeItem={activeItem}
                  // onClick={setActiveItem}
                />
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 mt-6 rounded-md hover:bg-red-50 transition text-red-600 text-sm"
            >
              <LogOut className="w-5 h-5" />{" "}
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-12">
          {activeItem === "overview" && (
            <OverviewSection
              user={user?.name}
              orders={orders}
              setActiveItem={setActiveItem}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          )}
          {activeItem === "orders" && (
            <OrdersSection
              orders={orders}
              refetch={refetch}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              orderOptions={orderOptions}
              setOrderOptions={setOrderOptions}
            />
          )}
          {activeItem === "track" && <Track />}
          {activeItem === "profile" && (
            <EditProfile user={user} loading={loading} />
          )}
          {activeItem === "password" && (
            <ChangePass user={user} loading={loading} />
          )}
          {activeItem === "support" && <Support />}
          {activeItem === "tickets" && <Tickets />}
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
