import { Category, SubCategory } from "@/types/menu";
import { useState } from "react";

interface UseCategoryManagementProps {
  categoryList: Category[]; 
  subCategoryList: SubCategory[];
}

export const useCategoryManagement = ({
  categoryList,
  subCategoryList,
}: UseCategoryManagementProps) => {
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<
    number[]
  >([]);

  const handleSeriesToggle = (seriesId: number) => {
    setSelectedSeriesIds((prev) => {
      const isSelected = prev.includes(seriesId);
      const newSeriesIds = isSelected
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId];

      // Filter categories based on new series selection
      const validCategoryIds = categoryList
        .filter((c) => newSeriesIds.includes(c.seriesId))
        .map((c) => c.id);

      setSelectedCategoryIds((prevCategories) =>
        prevCategories.filter((id) => validCategoryIds.includes(id)),
      );

      return newSeriesIds;
    });
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds((prev) => {
      const isSelected = prev.includes(categoryId);
      const newCategoryIds = isSelected
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];

      // Filter subcategories based on new category selection
      const validSubCategoryIds = subCategoryList
        .filter((sc) => newCategoryIds.includes(sc.categoryId))
        .map((sc) => sc.id);

      setSelectedSubCategoryIds((prevSubs) =>
        prevSubs.filter((id) => validSubCategoryIds.includes(id)),
      );

      return newCategoryIds;
    });
  };

  const handleSubCategoryToggle = (subCategoryId: number) => {
    setSelectedSubCategoryIds((prev) =>
      prev.includes(subCategoryId)
        ? prev.filter((id) => id !== subCategoryId)
        : [...prev, subCategoryId],
    );
  };

  return {
    selectedSeriesIds,
    selectedCategoryIds,
    selectedSubCategoryIds,
    handleSeriesToggle,
    handleCategoryToggle,
    handleSubCategoryToggle,
    setSelectedSeriesIds,
    setSelectedCategoryIds,
    setSelectedSubCategoryIds,
  };
};