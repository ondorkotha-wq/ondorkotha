/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Variant } from "@/types/product.types";
import { SizeDetail } from "@/component/admin/Product/ProductForm";

interface UseSizeManagementProps {
  selectedColors: number[];
  selectedVariant?: Variant | null; // Replace with proper type
  variantId: number | null;
  basePrice: number;
  defaultDiscount: { type?: "PERCENT" | "FIXED"; value: number };
  isEditMode: boolean;
  pageLoading: boolean;
  isHydrating: React.MutableRefObject<boolean>;
}

export const useSizeManagement = ({
  selectedColors,
  selectedVariant,
  variantId,
  basePrice,
  defaultDiscount,
  isEditMode,
  pageLoading,
  isHydrating,
}: UseSizeManagementProps) => {
  const [sizeSelections, setSizeSelections] = useState<{
    [colorId: number]: SizeDetail[];
  }>({});

  const availableSizes = selectedVariant?.sizes || [];

  // Initialize sizes when variant/colors change
  useEffect(() => {
    if (isEditMode) {
      if (pageLoading || isHydrating.current) return;
    } else {
      if (!variantId) return;
    }

    if (!selectedVariant) return;

    setSizeSelections((prev) => {
      const next = { ...prev };
      let changed = false;

      selectedColors.forEach((colorId) => {
        const existing = next[colorId] || [];
        const existingIds = new Set(existing.map((s) => s.sizeId));
        const missing = availableSizes.filter((s) => !existingIds.has(s.id));

        if (!next[colorId]) {
          next[colorId] = availableSizes.map((s) => ({
            sizeId: s.id,
            sku: "",
            price: basePrice || undefined,
            quantity: 0,
            discountType: null,
            discount: 0,
          }));
          changed = true;
        } else if (missing.length > 0) {
          next[colorId] = [
            ...existing,
            ...missing.map((s) => ({
              sizeId: s.id,
              sku: "",
              price: basePrice || undefined,
              quantity: 0,
              discountType: null,
              discount: 0,
            })),
          ];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [selectedColors, selectedVariant, variantId, pageLoading]);

  // Sync product discount to sizes
  useEffect(() => {
    if (isHydrating.current || !variantId) return;

    setSizeSelections((prev) => {
      const next = { ...prev };
      let changed = false;

      selectedColors.forEach((colorId) => {
        if (next[colorId]) {
          next[colorId] = next[colorId].map((size) => {
            if (!size.discountType || size.discountType === null) {
              changed = true;
              return {
                ...size,
                discountType: defaultDiscount.type,
                discount: defaultDiscount.value,
              };
            }
            return size;
          });
        }
      });

      return changed ? next : prev;
    });
  }, [defaultDiscount.type, defaultDiscount.value, selectedColors, variantId]);

  const handleSizeFieldChange = (
    colorId: number,
    sizeId: number,
    field: keyof SizeDetail,
    value: string | number | null,
  ) => {
    setSizeSelections((prev) => {
      const next = { ...prev };
      if (next[colorId]) {
        const idx = next[colorId].findIndex((s) => s.sizeId === sizeId);
        if (idx !== -1) {
          next[colorId][idx] = {
            ...next[colorId][idx],
            [field]:
              field === "quantity" || field === "discount"
                ? Number(value)
                : value,
          };
        }
      }
      return next;
    });
  };

  const calculateSizeDiscountedPrice = (size: SizeDetail) => {
    const price = size.price || basePrice;

    if (!size.discount || size.discount <= 0 || !size.discountType) {
      return price;
    }

    if (size.discountType === "PERCENT") {
      return price * (1 - size.discount / 100);
    } else {
      return Math.max(0, price - size.discount);
    }
  };

  const resetSizeDiscount = (colorId: number, sizeId: number) => {
    handleSizeFieldChange(colorId, sizeId, "discountType", null);
    handleSizeFieldChange(colorId, sizeId, "discount", 0);
  };

  return {
    sizeSelections,
    setSizeSelections,
    handleSizeFieldChange,
    calculateSizeDiscountedPrice,
    resetSizeDiscount,
    availableSizes,
  };
};
