import { JSX } from "react";

// Mobile Menu Item Types
export type MobileMenuItem =
  | { type: "link"; label: string }
  | {
      type: "collapsible";
      label: string;
      links: {
        label: string;
        href: string;
      }[];
      expanded: boolean;
    }
  | { type: "banner"; label: string };

// Mobile Menu Content mapping
export type MobileMenuContent = Record<string, MobileMenuItem[]>;

// MegaMenu Column Type
export interface MegaMenuColumn {
  title: string;
  // image?: string;
  links: {
    label: string;
    href: string;
  }[];
}

// Props for MegaMenu
export interface MegaMenuProps {
  data: MegaMenuColumn[];
  image: string | null | undefined;
}

// Props for MobileMenuDrawer
export interface MobileMenuDrawerProps {
  navItems: Series[];
  mobileMenuContent: MobileMenuContent;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  token: string | null;
  logoutIcon: () => JSX.Element;
  loading: boolean;
  handleAuthModal: () => void;
}

export interface SubCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  isCODAvailable?: boolean
  advancePercentage?: number
  isAdvancePayment?:boolean
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  seriesId: number;
  createdAt: string;
  updatedAt: string;
  series: Series;
  subCategories: SubCategory[];
}

export type SeriesType = "NORMAL" | "SALE" | "NEW";

export interface Series {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  notice: string | null;
  isActive?: boolean;
  sortOrder: number;
  seriesType?: SeriesType;
  createdAt?: string;
  updatedAt?: string;
  categories?: Category[];
}

export interface ShortSeries {
  id: number;
  name: string;
}

export interface SeriesWithRelations {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  notice: string | null;
  // isActive: boolean;
  sortOrder: number;
  seriesType?: SeriesType;
  // createdAt: string;
  // updatedAt: string;
  categories: Category[];
}
