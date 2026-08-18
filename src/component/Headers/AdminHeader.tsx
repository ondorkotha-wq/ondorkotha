"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminDrawer } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { ADMIN_NAV_SECTIONS } from "@/config/adminPermissions";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ChevronDown,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/utils/mergeTailwind";
import NotificationBell from "./NotificationBell";

const iconButtonClass = cn(
  "p-2 rounded-lg text-gray-600 transition-colors duration-200",
  "hover:text-gray-900 hover:bg-gray-100",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
);

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ORDERMANAGER: "Order Manager",
  PRODUCTMANAGER: "Product Manager",
  INVENTORYMANAGER: "Inventory Manager",
  SUPPORT: "Support",
  CUSTOMER: "Customer",
};

// Single source of truth for admin nav (src/config/adminPermissions.ts) —
// reused here so the header title and quick-search never drift from the
// sidebar's actual routes.
type QuickNavItem = { label: string; href: string; group: string };

const QUICK_NAV_ITEMS: QuickNavItem[] = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.items.flatMap((item) => {
    const entries: QuickNavItem[] = [];
    if (item.href) {
      entries.push({ label: item.name, href: item.href, group: section.label });
    }
    if (item.sub) {
      for (const sub of item.sub) {
        entries.push({ label: sub.label, href: sub.href, group: item.name });
      }
    }
    return entries;
  }),
);

const SETTINGS_HREF =
  ADMIN_NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.name === "Settings")
    ?.sub?.[0]?.href ?? "/admin/dashboard";

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "AD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function useActiveNavLabel(pathname: string | null): string {
  return useMemo(() => {
    if (!pathname) return "Overview";
    let best: { label: string; len: number } | null = null;
    for (const section of ADMIN_NAV_SECTIONS) {
      for (const item of section.items) {
        const hrefs = [item.href, ...(item.sub?.map((s) => s.href) ?? [])].filter(
          Boolean,
        ) as string[];
        for (const href of hrefs) {
          if (pathname === href || pathname.startsWith(`${href}/`)) {
            if (!best || href.length > best.len) {
              best = { label: item.name, len: href.length };
            }
          }
        }
      }
    }
    return best?.label ?? "Overview";
  }, [pathname]);
}

const AdminHeader = () => {
  const { isAdminOpen, toggleAdminDrawer, isMobile } = useAdminDrawer();
  const { user, logout } = useAuth();
  const axiosSecure = useAxiosSecure();
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = useActiveNavLabel(pathname);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return QUICK_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  const goTo = (href: string) => {
    router.push(href);
    setQuery("");
    searchInputRef.current?.blur();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && matches[0]) {
      goTo(matches[0].href);
    } else if (e.key === "Escape") {
      setQuery("");
      searchInputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await axiosSecure.post("/auth/logout");
    } catch {
      // Even if the server call fails, clear the local session below so the
      // user isn't stuck signed in on a dead network.
    } finally {
      logout();
      setShowUserMenu(false);
      setSigningOut(false);
      router.push("/admin/login");
    }
  };

  const displayName = user?.name?.trim() || "Admin";
  const contactLine = user?.email || user?.phone || "";
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleAdminDrawer}
              className={cn(iconButtonClass, "shrink-0")}
              aria-label={
                isAdminOpen
                  ? isMobile
                    ? "Close menu"
                    : "Collapse menu"
                  : isMobile
                    ? "Open menu"
                    : "Expand menu"
              }
              aria-expanded={isAdminOpen}
            >
              {isAdminOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>

            <div className="hidden md:block h-6 w-px bg-gray-200" />

            {/* Page Title - Desktop */}
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-gray-900 leading-none">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Nav Search */}
            <div className="relative hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search size={16} className="text-gray-500 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages..."
                  role="combobox"
                  aria-expanded={matches.length > 0}
                  aria-controls="admin-quick-nav-results"
                  className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 placeholder-gray-500"
                />
                <span className="text-xs text-gray-400 border-l border-gray-300 pl-2 shrink-0">
                  ⌘K
                </span>
              </div>

              {matches.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuery("")} />
                  <div
                    id="admin-quick-nav-results"
                    role="listbox"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto"
                  >
                    {matches.map((item) => (
                      <button
                        key={item.href}
                        role="option"
                        aria-selected={false}
                        onClick={() => goTo(item.href)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-gray-400">{item.group}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <NotificationBell />

            <div className="hidden lg:block h-6 w-px bg-gray-200 mx-1" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg transition-colors duration-200 hover:bg-gray-100",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                )}
                aria-label="Open user menu"
                aria-expanded={showUserMenu}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(user?.name)}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <ChevronDown size={16} className="text-gray-500 hidden lg:block" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                      {contactLine && (
                        <p className="text-xs text-gray-500 mt-0.5">{contactLine}</p>
                      )}
                      {roleLabel && (
                        <p className="text-xs text-indigo-600 mt-0.5">{roleLabel}</p>
                      )}
                    </div>

                    <Link
                      href={SETTINGS_HREF}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={16} className="text-gray-500" />
                      Settings
                    </Link>

                    {user?.role === "SUPERADMIN" && (
                      <Link
                        href="/admin/admin-users"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield size={16} className="text-gray-500" />
                        Admin Users
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      disabled={signingOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full disabled:opacity-60"
                    >
                      <LogOut size={16} />
                      {signingOut ? "Signing out..." : "Sign Out"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pages..."
              className="bg-transparent border-none outline-none text-sm flex-1 placeholder-gray-500"
            />
          </div>

          {matches.length > 0 && (
            <div className="mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto">
              {matches.map((item) => (
                <button
                  key={item.href}
                  onClick={() => goTo(item.href)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400">{item.group}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;