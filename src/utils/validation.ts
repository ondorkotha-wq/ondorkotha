import { Color } from "@/types/product.types";
import { ProductImageItem } from "@/component/admin/Product/ImageUploader";
import { ProductFormData, SizeDetail } from "@/component/admin/Product/ProductForm";

interface ValidateProductProps {
  formData: ProductFormData;
  defaultImages: ProductImageItem[];
  colorImages: Record<number, ProductImageItem[]>;
  sizeSelections: Record<number, SizeDetail[]>;
  colors: Color[]; // Replace with proper Color type
}

export const validateProduct = ({
  formData,
  defaultImages,
  colorImages,
  sizeSelections,
  colors,
}: ValidateProductProps): string | null => {
  // Basic info validation
  if (!formData.title.trim()) {
    return "Product title is required";
  }

  if (formData.basePrice <= 0) {
    return "Price must be greater than 0";
  }

  // Category validation
  if (formData.selectedSubCategoryIds.length === 0) {
    return "Please select at least one subcategory";
  }

  // Image validation
  const hasImages =
    defaultImages.length > 0 ||
    Object.values(colorImages).some((imgs) => imgs.length > 0);
  
  if (!hasImages) {
    return "Please upload at least one product image";
  }

  // Variant validation
  if (formData.hasColorVariants && !formData.variantId) {
    return "Please select a variant type";
  }

  // Color size validation
  if (formData.hasColorVariants) {
    for (const colorId of formData.selectedColors) {
      const hasValidSize = (sizeSelections[colorId] || []).some(
        (s) => s.quantity > 0
      );
      
      if (!hasValidSize) {
        const color = colors.find((c) => c.id === colorId);
        return `Color "${color?.name || "Unknown"}" must have at least one size with quantity > 0`;
      }
    }
  }

  // Discount date validation
  if (formData.discount > 0) {
    if (!formData.discountStart || !formData.discountEnd) {
      return "Discount start and end dates are required when discount is applied";
    }

    const startDate = new Date(formData.discountStart);
    const endDate = new Date(formData.discountEnd);
    
    if (startDate > endDate) {
      return "Discount end date must be after start date";
    }

    if (endDate < new Date()) {
      return "Discount end date cannot be in the past";
    }
  }

  // Size-specific discount validation
  for (const colorId of formData.selectedColors) {
    const sizes = sizeSelections[colorId] || [];
    
    for (const size of sizes) {
      if (size.discountType && size.discount) {
        // Validate discount type
        if (size.discountType === "PERCENT" && size.discount > 100) {
          const color = colors.find((c) => c.id === colorId);
          const sizeObj = size; // You might want to fetch size name here
          return `Discount percentage for ${color?.name} size cannot exceed 100%`;
        }

        if (size.discountType === "FIXED") {
          const basePrice = size.price || formData.basePrice;
          if (size.discount > basePrice) {
            const color = colors.find((c) => c.id === colorId);
            return `Fixed discount for ${color?.name} size cannot exceed the price (${basePrice})`;
          }
        }
      }
    }
  }

  // SKU validation (optional but recommended)
  if (formData.hasColorVariants) {
    const skus = new Set<string>();
    
    for (const colorId of formData.selectedColors) {
      const sizes = sizeSelections[colorId] || [];
      
      for (const size of sizes) {
        if (size.sku) {
          if (skus.has(size.sku)) {
            const color = colors.find((c) => c.id === colorId);
            return `Duplicate SKU "${size.sku}" found for ${color?.name}`;
          }
          skus.add(size.sku);
        }
      }
    }
  }

  // Price validation for sizes
  for (const colorId of formData.selectedColors) {
    const sizes = sizeSelections[colorId] || [];
    
    for (const size of sizes) {
      if (size.price && size.price <= 0) {
        const color = colors.find((c) => c.id === colorId);
        return `Price for ${color?.name} size must be greater than 0`;
      }
    }
  }

  return null;
};

// Additional validation utilities

export const validateDiscount = (
  discountType: "PERCENT" | "FIXED",
  discount: number,
  basePrice: number
): string | null => {
  if (discount < 0) {
    return "Discount cannot be negative";
  }

  if (discountType === "PERCENT" && discount > 100) {
    return "Percentage discount cannot exceed 100%";
  }

  if (discountType === "FIXED" && discount > basePrice) {
    return "Fixed discount cannot exceed the product price";
  }

  return null;
};

export const validateSizeQuantity = (
  sizes: SizeDetail[]
): { isValid: boolean; message?: string } => {
  const hasQuantity = sizes.some((s) => s.quantity > 0);
  
  if (!hasQuantity) {
    return {
      isValid: false,
      message: "At least one size must have quantity greater than 0",
    };
  }

  return { isValid: true };
};

export const validateImages = (
  defaultImages: ProductImageItem[],
  colorImages: Record<number, ProductImageItem[]>
): { isValid: boolean; message?: string } => {
  const hasDefaultImages = defaultImages.length > 0;
  const hasColorImages = Object.values(colorImages).some(
    (imgs) => imgs.length > 0
  );

  if (!hasDefaultImages && !hasColorImages) {
    return {
      isValid: false,
      message: "Please upload at least one product image",
    };
  }

  // Check for duplicate serial numbers in default images
  const serialNos = new Set<number>();
  for (const img of defaultImages) {
    if (serialNos.has(img.serialNo)) {
      return {
        isValid: false,
        message: `Duplicate serial number ${img.serialNo} found in default images`,
      };
    }
    serialNos.add(img.serialNo);
  }

  return { isValid: true };
};

// Slug generation utility
export const generateSlug = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
};

// Date validation
export const isValidDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  if (!startDate || !endDate) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  return start <= end && end >= now;
};

// Price validation
export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && price > 0 && isFinite(price);
};

// SKU validation (example format: ABC-123-XYZ)
export const isValidSKU = (sku: string): boolean => {
  const skuRegex = /^[A-Z0-9-]{3,20}$/;
  return skuRegex.test(sku);
};