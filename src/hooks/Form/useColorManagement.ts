import { ProductImageItem } from "@/component/admin/Product/ImageUploader";
import { Variant } from "@/types/product.types";
import { useState } from "react";

interface UseColorManagementProps {
  selectedVariant?: Variant | null; 
  basePrice: number;
  isEditMode: boolean;
}

export const useColorManagement = ({
  selectedVariant,
  basePrice,
  isEditMode,
}: UseColorManagementProps) => {
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [colorImages, setColorImages] = useState<
    Record<number, ProductImageItem[]>
  >({});
  const [colorUseDefault, setColorUseDefault] = useState<
    Record<number, boolean>
  >({});

  const handleColorToggle = (colorId: number, initializeSizes?: (colorId: number) => void) => {
    setSelectedColors((prev) => {
      const isSelected = prev.includes(colorId);
      const newColors = isSelected
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId];

      if (!isSelected) {
        // Initialize color-specific data
        if (initializeSizes) {
          initializeSizes(colorId);
        }
        setColorImages((prev) => ({ ...prev, [colorId]: [] }));
        setColorUseDefault((prev) => ({ ...prev, [colorId]: true }));
      } else if (!isEditMode) {
        // Clean up in create mode
        setColorImages((prev) => {
          const next = { ...prev };
          delete next[colorId];
          return next;
        });
        setColorUseDefault((prev) => {
          const next = { ...prev };
          delete next[colorId];
          return next;
        });
      }

      return newColors;
    });
  };

  const handleColorImagesChange = (
    colorId: number,
    images: ProductImageItem[],
  ) => {
    setColorImages((prev) => ({ ...prev, [colorId]: images }));
  };

  const handleColorUseDefaultChange = (colorId: number, useDefault: boolean) => {
    setColorUseDefault((prev) => ({ ...prev, [colorId]: useDefault }));
  };

  return {
    selectedColors,
    setSelectedColors,
    colorImages,
    setColorImages,
    colorUseDefault,
    setColorUseDefault,
    handleColorToggle,
    handleColorImagesChange,
    handleColorUseDefaultChange,
  };
};