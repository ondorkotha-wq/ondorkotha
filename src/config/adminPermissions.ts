import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Layers,
  Percent,
  Image,
  Sliders,
  FileText,
  Grid,
  Newspaper,
  Boxes,
  RotateCcw,
  Ticket,
  Search,
} from "lucide-react";
import { MdCategory } from "react-icons/md";
import type { ElementType } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for admin nav + page/route permissions.
//
// Every entry with an `href` doubles as a route-permission rule: AdminDrawer
// uses requiredAction/requiredRole to decide what to show, and
// RoutePermissionGuard (src/component/admin/auth/RoutePermissionGuard.tsx)
// uses the exact same fields to decide whether the page is allowed to render
// when the URL is opened directly. Routes not reachable from the sidebar
// (edit/detail pages, mainly) are added separately in EXTRA_ROUTE_PERMISSIONS
// below using the same shape, so both consumers stay in sync with one file.
// ─────────────────────────────────────────────────────────────────────────────

export interface NavSubItem {
  href: string;
  label: string;
  badge?: number;
  // OR semantics — item is visible/reachable if the user has ANY of these actions.
  requiredAction?: string | string[];
  // Hard role allowlist (e.g. superadmin-only pages). Takes priority over
  // requiredAction and does NOT fail open — role is known synchronously
  // from AuthContext, so there's no loading window to fail open during.
  requiredRole?: string[];
}

export interface NavItem {
  name: string;
  icon: ElementType;
  href?: string;
  sub?: NavSubItem[];
  badge?: number;
  requiredAction?: string | string[];
  requiredRole?: string[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard",
        requiredAction: "DASHBOARD_VIEW",
        sub: [{ href: "/admin/dashboard", label: "Overview" }],
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        name: "Tickets",
        icon: Ticket,
        href: "/admin/tickets",
        requiredAction: "TICKET_VIEW",
        sub: [{ href: "/admin/tickets", label: "All Tickets" }],
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        name: "Products",
        icon: Package,
        sub: [
          { href: "/admin/products", label: "All Products", requiredAction: "PRODUCT_VIEW" },
          { href: "/admin/product/add", label: "Add Product", requiredAction: "PRODUCT_CREATE" },
          { href: "/admin/product/reviews", label: "Reviews", requiredAction: "REVIEW_MANAGE" },
        ],
      },
      {
        name: "Inventory",
        icon: Boxes,
        sub: [
          { href: "/admin/inventory", label: "Stock Levels", requiredAction: "INVENTORY_VIEW" },
          {
            href: "/admin/pieces",
            label: "Piece Barcodes",
            requiredAction: ["PIECE_VIEW", "PIECE_GENERATE", "PIECE_RECEIVE"],
          },
          { href: "/admin/suppliers", label: "Suppliers", requiredAction: "SUPPLIER_VIEW" },
        ],
      },
      {
        name: "Subcategories",
        icon: MdCategory,
        sub: [
          { href: "/admin/subcategory/all", label: "All Subcategories", requiredAction: "CATEGORY_VIEW" },
          { href: "/admin/subcategory/add", label: "Add Subcategory", requiredAction: "CATEGORY_CREATE" },
        ],
      },
      {
        name: "Categories",
        icon: Grid,
        sub: [
          { href: "/admin/category/all", label: "All Categories", requiredAction: "CATEGORY_VIEW" },
          { href: "/admin/category/add", label: "Add Category", requiredAction: "CATEGORY_CREATE" },
        ],
      },
      {
        name: "Series",
        icon: Layers,
        sub: [
          { href: "/admin/series/all", label: "All Series", requiredAction: "CATEGORY_VIEW" },
          { href: "/admin/series/add", label: "Add Series", requiredAction: "CATEGORY_CREATE" },
        ],
      },
      {
        name: "Attributes",
        icon: Sliders,
        sub: [
          { href: "/admin/attribute/colors", label: "Colors", requiredAction: "CMS_COLOR_MANAGE" },
          { href: "/admin/attribute/sizes", label: "Sizes", requiredAction: "CMS_SIZE_MANAGE" },
          { href: "/admin/attribute/variants", label: "Variants", requiredAction: "CMS_VARIANT_MANAGE" },
          { href: "/admin/attribute/materials", label: "Materials", requiredAction: "CMS_MATERIAL_MANAGE" },
        ],
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        name: "Orders",
        icon: ShoppingCart,
        sub: [
          { href: "/admin/orders", label: "All Orders", requiredAction: "ORDER_VIEW" },
          { href: "/admin/courier", label: "Couriers", requiredAction: "COURIER_VIEW" },
        ],
      },
      {
        name: "Returns & Refunds",
        icon: RotateCcw,
        sub: [
          { href: "/admin/returns", label: "Return Requests", requiredAction: "RETURN_VIEW" },
          { href: "/admin/refunds", label: "Refunds", requiredAction: "REFUND_VIEW" },
        ],
      },
      {
        name: "Promotions",
        icon: Percent,
        sub: [
          { href: "/admin/promotions/coupons", label: "Coupons", requiredAction: "COUPON_READ" },
          { href: "/admin/promotions/flash-sales", label: "Flash Sales", requiredAction: "FLASH_SALE_MANAGE" },
        ],
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        name: "Blog",
        icon: Newspaper,
        sub: [
          { href: "/admin/blog/add", label: "Create Blog", requiredAction: "BLOG_CREATE" },
          { href: "/admin/blog/all-blogs", label: "All Blogs" },
        ],
      },
      {
        name: "Static Pages",
        icon: FileText,
        sub: [
          { href: "/admin/cms/static-pages", label: "All Pages", requiredAction: "CMS_STATIC_PAGE_MANAGE" },
        ],
      },
      {
        name: "SEO",
        icon: Search,
        sub: [
          { href: "/admin/cms/seo", label: "Page Meta", requiredAction: "SEO_MANAGE" },
        ],
      },
      {
        name: "Terms & Conditions",
        icon: FileText,
        sub: [
          { href: "/admin/cms/terms-and-conditions", label: "All Sections", requiredAction: "CMS_TNC_MANAGE" },
        ],
      },
      {
        name: "Privacy Policy",
        icon: FileText,
        sub: [
          { href: "/admin/cms/privacy-policy", label: "Edit Policy", requiredAction: "CMS_PRIVACY_POLICY_MANAGE" },
        ],
      },
      {
        name: "Email Templates",
        icon: FileText,
        sub: [
          { href: "/admin/cms/email-templates", label: "All Templates", requiredAction: "CMS_EMAIL_TEMPLATE_MANAGE" },
        ],
      },
      {
        name: "Banners",
        icon: Image,
        sub: [
          { href: "/admin/banners/promo-banners", label: "Promo Banner", requiredAction: "BANNER_MANAGE" },
          { href: "/admin/banners/broad-banners", label: "Broad Banner", requiredAction: "BANNER_MANAGE" },
          { href: "/admin/banners/urgency-banners", label: "Urgency Banner", requiredAction: "BANNER_MANAGE" },
        ],
      },
      {
        name: "Homepage",
        icon: LayoutDashboard,
        sub: [
          { href: "/admin/banners/homepage-banners", label: "Homepage Banner", requiredAction: "BANNER_MANAGE" },
          {
            href: "/admin/seasonal-categories",
            label: "Seasonal Categories",
            requiredAction: [
              "SEASONAL_CATEGORY_CREATE",
              "SEASONAL_CATEGORY_UPDATE",
              "SEASONAL_CATEGORY_DELETE",
              "SEASONAL_CATEGORY_REORDER",
            ],
          },
          {
            href: "/admin/homepage-gallery",
            label: "Homepage Gallery",
            requiredAction: [
              "HOMEPAGE_GALLERY_CREATE",
              "HOMEPAGE_GALLERY_UPDATE",
              "HOMEPAGE_GALLERY_DELETE",
              "HOMEPAGE_GALLERY_REORDER",
            ],
          },
          {
            href: "/admin/featured-categories",
            label: "Featured Categories",
            requiredAction: ["FEATURED_CATEGORY_VIEW", "FEATURED_CATEGORY_MANAGE"],
          },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Activity Log",
        icon: FileText,
        sub: [{ href: "/admin/activity-log", label: "All Logs", requiredAction: "CMS_VIEW" }],
      },
      {
        name: "Admin Management",
        icon: FileText,
        requiredRole: ["SUPERADMIN"],
        sub: [
          { href: "/admin/admin-users", label: "Admin Users", requiredRole: ["SUPERADMIN"] },
          { href: "/admin/permissions", label: "Permissions", requiredRole: ["SUPERADMIN"] },
        ],
      },
      {
        name: "Settings",
        icon: Settings,
        sub: [
          { href: "/admin/settings/company", label: "Company Info", requiredAction: "COMPANY_MANAGE" },
          {
            href: "/admin/settings/barcode-labels",
            label: "Barcode & Label Settings",
            requiredAction: "SETTINGS_MANAGE",
          },
          { href: "/admin/settings/invoice", label: "Invoice Settings", requiredAction: "SETTINGS_MANAGE" },
          { href: "/admin/settings/shipping/districts", label: "Districts", requiredAction: "DISTRICT_MANAGE" },
          {
            href: "/admin/settings/payment-methods",
            label: "Payment Methods",
            requiredAction: "PAYMENT_METHOD_VIEW",
          },
        ],
      },
    ],
  },
];

// Routes that exist (page.tsx files) but aren't linked from the sidebar —
// mostly edit/detail pages reached via a "row action" rather than a nav
// link, plus the couple of unfinished stub pages. Same rule shape as above.
// `*` in a path segment matches any single dynamic segment (Next.js [slug]/[id]).
export const EXTRA_ROUTE_PERMISSIONS: NavSubItem[] = [
  { href: "/admin", label: "Dashboard root", requiredAction: "DASHBOARD_VIEW" },
  { href: "/admin/products/update/*", label: "Edit Product", requiredAction: "PRODUCT_UPDATE" },
  { href: "/admin/product-sync-prices", label: "Sync Prices", requiredAction: "PRODUCT_SYNC" },
  { href: "/admin/category/update/*", label: "Edit Category", requiredAction: "CATEGORY_UPDATE" },
  { href: "/admin/subcategory/update/*", label: "Edit Subcategory", requiredAction: "CATEGORY_UPDATE" },
  { href: "/admin/series/update/*", label: "Edit Series", requiredAction: "CATEGORY_UPDATE" },
  { href: "/admin/attribute/add-size", label: "Add Size", requiredAction: "CMS_SIZE_MANAGE" },
  { href: "/admin/attribute/add-variant", label: "Add Variant", requiredAction: "CMS_VARIANT_MANAGE" },
  { href: "/admin/blog/update/*", label: "Edit Blog", requiredAction: "BLOG_UPDATE" },
  { href: "/admin/tickets/*", label: "Ticket Detail", requiredAction: "TICKET_VIEW" },
];

// AdminGuard already restricts this whole layout to authenticated admin
// roles; the login page renders inside the same layout tree so it must not
// be run through the permission check.
export const PERMISSION_EXEMPT_ROUTES = ["/admin/login"];

function flattenNavRoutes(): NavSubItem[] {
  const routes: NavSubItem[] = [];
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.href) {
        routes.push({
          href: item.href,
          label: item.name,
          requiredAction: item.requiredAction,
          requiredRole: item.requiredRole,
        });
      }
      if (item.sub) {
        for (const sub of item.sub) {
          routes.push(sub);
        }
      }
    }
  }
  return routes;
}

export const ADMIN_ROUTE_PERMISSIONS: NavSubItem[] = [
  ...flattenNavRoutes(),
  ...EXTRA_ROUTE_PERMISSIONS,
];

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function matchesPattern(pattern: string, pathname: string): boolean {
  const patternSegs = segments(pattern);
  const pathSegs = segments(pathname);
  if (patternSegs.length !== pathSegs.length) return false;
  return patternSegs.every((seg, i) => seg === "*" || seg === pathSegs[i]);
}

/**
 * Finds the permission rule for a given admin pathname. Prefers the most
 * specific (longest, non-wildcard-heavy) match when multiple patterns could
 * apply. Returns null if the route isn't in the map — unmapped routes are
 * treated as "any authenticated admin" (consistent with how the sidebar
 * already treats items with no requiredAction/requiredRole).
 */
export function matchRoutePermission(pathname: string): NavSubItem | null {
  const candidates = ADMIN_ROUTE_PERMISSIONS.filter((r) => matchesPattern(r.href, pathname));
  if (candidates.length === 0) return null;
  // Prefer exact (no wildcard) matches over wildcard matches.
  candidates.sort((a, b) => {
    const aWild = a.href.includes("*") ? 1 : 0;
    const bWild = b.href.includes("*") ? 1 : 0;
    return aWild - bWild;
  });
  return candidates[0];
}
