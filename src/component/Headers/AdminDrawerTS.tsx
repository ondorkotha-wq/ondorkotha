/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminDrawer } from "@/context/AdminContext";
import {
  ChevronRight,
  ChevronDown,
  Menu,
  Store,
} from "lucide-react";
import { cn } from "@/utils/mergeTailwind";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { ADMIN_NAV_SECTIONS, type NavSection } from "@/config/adminPermissions";

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ORDERMANAGER: "Order Manager",
  PRODUCTMANAGER: "Product Manager",
  INVENTORYMANAGER: "Inventory Manager",
  SUPPORT: "Support",
  CUSTOMER: "Customer",
};

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "AD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AdminDrawer = () => {
  const { isAdminOpen, toggleAdminDrawer, isMobile } = useAdminDrawer();
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    role: permRole,
    actions: grantedActions,
    loading: permLoading,
    error: permError,
  } = usePermissions();

  // Fails open: unmapped items (no requiredAction/requiredRole) are always
  // visible; while permissions are loading or failed to fetch, requiredAction
  // checks also pass — worst case is identical to today's "show everything"
  // behavior, never a broken/blank sidebar. requiredRole is the one hard
  // exception (superadmin-only pages), since role is already known
  // synchronously and there's no loading window to fail open during.
  const canSeeAction = (action?: string | string[]) => {
    if (!action) return true;
    if (permLoading || permError) return true;
    if (permRole === "SUPERADMIN") return true;
    const required = Array.isArray(action) ? action : [action];
    return required.some((a) => grantedActions.includes(a));
  };

  const canSeeRole = (roles?: string[]) => {
    if (!roles) return true;
    return !!user && roles.includes(user.role);
  };

  const isNavItemVisible = (item: {
    requiredAction?: string | string[];
    requiredRole?: string[];
  }) => {
    if (item.requiredRole) return canSeeRole(item.requiredRole);
    if (item.requiredAction) return canSeeAction(item.requiredAction);
    return true;
  };
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Dashboard: true,
    Products: false,
    Orders: false,
    Inventory: false,
    Customers: false,
    Marketing: false,
    Content: false,
    "Static Pages": false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" && pathname === "/admin") return true;
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const navSections: NavSection[] = ADMIN_NAV_SECTIONS;

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items
        .filter(isNavItemVisible)
        .map((item) => ({
          ...item,
          sub: item.sub?.filter(isNavItemVisible),
        }))
        .filter((item) => !item.sub || item.sub.length > 0),
    }))
    .filter((section) => section.items.length > 0);

  if (!mounted) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
          isAdminOpen ? "w-64" : "w-20",
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100">
          <Link
            href="/admin"
            className={cn(
              "flex items-center",
              !isAdminOpen && "justify-center w-full",
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg shadow-md">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            {isAdminOpen && (
              <span className="ml-3 font-semibold text-gray-900">
                Ondorkotha<span className="text-indigo-600 ml-0.5">Pro</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
          {visibleSections.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              {isAdminOpen && (
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {section.label}
                  </span>
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.sub && item.sub.length > 0;
                  const isExpanded = expandedItems[item.name];
                  const isItemActive = item.href ? isActive(item.href) : false;
                  const hasActiveChild = item.sub?.some((sub) =>
                    isActive(sub.href),
                  );

                  return (
                    <li key={item.name}>
                      {hasSubItems ? (
                        <>
                          <button
                            onClick={() => toggleExpand(item.name)}
                            className={cn(
                              "group w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
                              isAdminOpen
                                ? "justify-between"
                                : "justify-center",
                              isItemActive || hasActiveChild
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                            )}
                          >
                            <div className="flex items-center">
                              <Icon
                                size={18}
                                className={cn(
                                  "shrink-0 transition-colors",
                                  isItemActive || hasActiveChild
                                    ? "text-indigo-600"
                                    : "text-gray-400 group-hover:text-gray-600",
                                )}
                              />
                              {isAdminOpen && (
                                <span
                                  className={cn(
                                    "ml-3 text-sm font-medium",
                                    (isItemActive || hasActiveChild) &&
                                      "text-indigo-700",
                                  )}
                                >
                                  {item.name}
                                </span>
                              )}
                            </div>
                            {isAdminOpen && (
                              <div className="flex items-center gap-1">
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                                <span className="text-gray-400">
                                  {isExpanded ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </span>
                              </div>
                            )}
                          </button>

                          {/* Submenu */}
                          {isAdminOpen && isExpanded && item.sub && (
                            <ul className="mt-1 ml-9 space-y-0.5">
                              {item.sub.map((subItem) => {
                                const isSubActive = isActive(subItem.href);
                                return (
                                  <li key={subItem.href}>
                                    <Link
                                      href={subItem.href}
                                      className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all",
                                        isSubActive
                                          ? "bg-indigo-50 text-indigo-700 font-medium"
                                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                      )}
                                    >
                                      <span>{subItem.label}</span>
                                      {subItem.badge && (
                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                          {subItem.badge}
                                        </span>
                                      )}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href || "#"}
                          className={cn(
                            "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
                            isAdminOpen ? "justify-start" : "justify-center",
                            isItemActive
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                          )}
                        >
                          <Icon
                            size={18}
                            className={cn(
                              "shrink-0",
                              isItemActive
                                ? "text-indigo-600"
                                : "text-gray-400",
                            )}
                          />
                          {isAdminOpen && (
                            <>
                              <span className="ml-3 text-sm font-medium">
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          {isAdminOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="relative">
                  <div className="w-9 h-9 bg-linear-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(user?.name)}
                    </span>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name?.trim() || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user ? (ROLE_LABELS[user.role] ?? user.role) : ""}
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <Store
                  size={16}
                  className="text-gray-400 group-hover:text-gray-600"
                />
                <span>Back to Store</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-linear-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(user?.name)}
                  </span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <Link
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Back to Store"
              >
                <Store size={16} />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {isAdminOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={toggleAdminDrawer}
            />
          )}

          {/* Mobile Drawer */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 md:hidden flex flex-col bg-white w-72 shadow-2xl transition-transform duration-300 ease-in-out",
              isAdminOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-semibold text-gray-900">
                  Ondorkotha<span className="text-indigo-600">Pro</span>
                </span>
              </Link>
              <button
                onClick={toggleAdminDrawer}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Mobile Navigation - Same content as desktop but always expanded */}
            <nav className="flex-1 overflow-y-auto py-6 px-3">
              {visibleSections.map((section) => (
                <div key={section.label} className="mb-6">
                  <div className="px-3 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {section.label}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const hasSubItems = item.sub && item.sub.length > 0;

                      return (
                        <li key={item.name}>
                          <div className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              <Icon size={18} className="text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {item.name}
                              </span>
                            </div>
                          </div>
                          {hasSubItems && (
                            <ul className="ml-9 space-y-0.5">
                              {item.sub?.map((subItem) => (
                                <li key={subItem.href}>
                                  <Link
                                    href={subItem.href}
                                    onClick={toggleAdminDrawer}
                                    className={cn(
                                      "flex items-center justify-between px-3 py-2 rounded-md text-sm",
                                      isActive(subItem.href)
                                        ? "bg-indigo-50 text-indigo-700 font-medium"
                                        : "text-gray-600 hover:bg-gray-50",
                                    )}
                                  >
                                    <span>{subItem.label}</span>
                                    {subItem.badge && (
                                      <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-3">
                <div className="w-9 h-9 bg-linear-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(user?.name)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name?.trim() || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user ? (ROLE_LABELS[user.role] ?? user.role) : ""}
                  </p>
                </div>
              </div>
              <Link
                href="/"
                onClick={toggleAdminDrawer}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Store size={16} className="text-gray-500" />
                <span>Back to Store</span>
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default AdminDrawer;
