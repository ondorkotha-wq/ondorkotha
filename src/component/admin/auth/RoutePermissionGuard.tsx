"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import {
  matchRoutePermission,
  PERMISSION_EXEMPT_ROUTES,
} from "@/config/adminPermissions";
import AdminForbidden from "./AdminForbidden";
import LoadingDots from "@/component/Loading/LoadingDS";

/**
 * Server-side (backend) authorization is the real security boundary — every
 * mutation is independently re-checked by RolesGuard/@Permission on the API.
 * This guard exists so a restricted admin can't reach a page's UI at all by
 * typing its URL directly (previously only the sidebar hid it, which did
 * nothing once you knew the path). Matches the current pathname against the
 * single route→permission map in src/config/adminPermissions.ts — the same
 * map the sidebar uses to decide what to show.
 */
export default function RoutePermissionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const { user } = useAuth();
  const { role, actions, loading, error } = usePermissions();

  if (PERMISSION_EXEMPT_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  const rule = matchRoutePermission(pathname);

  // Unmapped routes are allowed for any authenticated admin — AdminGuard
  // (the parent) has already confirmed that much.
  if (!rule || (!rule.requiredAction && !rule.requiredRole)) {
    return <>{children}</>;
  }

  // Role allowlists are known synchronously from AuthContext, no loading
  // window to account for.
  if (rule.requiredRole) {
    const allowed = !!user && rule.requiredRole.includes(user.role);
    if (!allowed) return <AdminForbidden />;
    return <>{children}</>;
  }

  // Action-based checks depend on /permissions/mine, which loads async.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingDots />
      </div>
    );
  }

  // A failed permissions fetch degrades to "block the page" here — the
  // opposite of the sidebar's fail-open, since this is the actual access
  // gate, not just a nav-visibility hint.
  if (error) {
    return <AdminForbidden />;
  }

  if (role === "SUPERADMIN") {
    return <>{children}</>;
  }

  const required = Array.isArray(rule.requiredAction)
    ? rule.requiredAction
    : [rule.requiredAction as string];
  const allowed = required.some((a) => actions.includes(a));

  if (!allowed) {
    return <AdminForbidden />;
  }

  return <>{children}</>;
}
