import { OrderItem } from "@/hooks/Order/useOrders";
import { SubCategory } from "./menu";
import { Material } from "@/hooks/Attributes/useFetchMaterials";

export interface Product {
  id: number;
  title: string;
  slug: string;
  sku: string | null;
  weight: number | null;
  description: string | null;
  basePrice: number;
  price: number;
  hasColorVariants: boolean;
  showColor: boolean;
  discountType?: "PERCENT" | "FIXED";
  discount: number;
  discountEnd: string | null;
  discountStart: string | null;
  note: string | null;
  deliveryEstimate: string | null;
  productDetails: string | null;
  dimension: string | null;
  shippingReturn: string | null;
  rating: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  materialId?: number | null;
  material?: Material;
  isNew?: boolean;
  isFeatured?: boolean;
  brand?: string | null;
  tags?: Tag[];
  images: ProductImage[];
  colors: ProductColor[];
  reviews: Review[];
  subCategories: ProductSubCategory[];
}

export interface ProductSubCategory {
  productId: number;
  name?: string;
  subCategoryId: number;
  product: Product;
  subCategory: SubCategory;
}

export interface SubCategoryRelation {
  subCategory: {
    id: number;
    name: string;
  };
}

export interface ProductImage {
  id: number;
  image: string;
  serialNo: number;
  alt?: string | null;
  productId: number;
}

export interface ProductColorImage {
  id: number;
  image: string;
  serialNo: number;
  productColorId: number;
}

export interface ProductSize {
  id: number;
  sku?: string;
  basePrice?: number;
  price: number;
  quantity?: number;
  sizeId?: number;
  size: ProductSizeRelation;
  colorId?: number;
  color?: ProductColor;
  discountType?: "PERCENT" | "FIXED" | null;
  discount?: number;
  trackingMode?: "LEGACY_QUANTITY" | "PIECE_BARCODE";
}

export interface ProductColor {
  id: number;
  useDefaultImages: boolean;
  colorId: number;
  color: Color;
  productId: number;
  product: Product;
  images?: ProductColorImage[];
  sizes?: ProductSize[];
}

export interface Color {
  id: number;
  name: string;
  hexCode?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: Date;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  user?: User;
  userId: number;
  createdAt: Date;
  isHidden: boolean;
  isFeatured: boolean;
  orderItem?: OrderItem;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  reviews: Review[];
}

enum UserRole {
  SUPERADMIN,
  PRODUCTMANAGER,
  ORDERMANAGER,
  INVENTORYMANAGER,
  SUPPORT,
  CUSTOMER,
}

export interface Variant {
  id: number;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
  sizes?: {
    name: string;
    id: number;
  }[];
}

export interface ProductSizeRelation {
  id: number;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
  variantId: number;
  variant?: Variant;
}

interface ProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsResponse {
  data: Product[];
  meta: ProductsMeta;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | null;

  colorIds?: number[];
  materialIds?: number[];
  subCategoryIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  order?: string;
  sortBy?: string;

  thumb?: boolean;
  enabled?: boolean;
  includeOutOfStock?: boolean;
}

export interface CartItem {
  id: number;
  cartId?: number;
  quantity: number;
  priceAtAdd: number;
  subtotal: number;
  color?: string;
  size?: string;
  cart?: Cart;
  productSizeId: number;
  productSize?: ProductSize;
  subtotalAtAdd?: number;
  baseSubtotalAtAdd?: number;
}

export type CartStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"; // adjust if you have more

export interface Cart {
  id: number;
  userId: number;
  status: CartStatus;
  createdAt: string;
  updatedAt: string;

  // Relations
  items?: CartItem[];
  user?: User;
}

export type Tag = {
  id: number;
  name: string;
};

export interface FlashSale {
  id: number;
  title: string;
  subtitle: string | null;
  bannerText: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: Product[];
}
