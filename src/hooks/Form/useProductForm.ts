/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSizeManagement } from "./useSizeManagement";
import { useColorManagement } from "./useColorManagement";
import { useCategoryManagement } from "./useCategoryManagement";
import { useTagManagement } from "./useTagManagement";
import { useImageUpload } from "./useImageUpload";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import useFetchVariants from "@/hooks/Attributes/useFetchVariants";
import useFetchColors from "@/hooks/Attributes/useFetchColors";
import useFetchCategoriesBySeriesIds from "@/hooks/Admin/Categories/useFetchCategoriesBySeriesIds";
import useFetchSubCategoriesByCategoryIds from "@/hooks/Categories/Subcategories/useFetchSubCategoriesByCategoryIds";
import useFetchMaterials from "@/hooks/Attributes/useFetchMaterials";
import { ProductFormData } from "@/component/admin/Product/ProductForm";
import { generateSlug, validateProduct } from "@/utils/validation";
import { Product, ProductColor, ProductSubCategory } from "@/types/product.types";

const initialFormData: ProductFormData = {
  title: "",
  slug: "",
  sku: "",
  basePrice: 0,
  description: "",
  brand: "",
  weight: 0,
  hasColorVariants: true,
  showColor: true,
  discountType: "PERCENT",
  discount: 0,
  discountStart: new Date().toISOString().split("T")[0],
  discountEnd: new Date().toISOString().split("T")[0],
  note: "",
  deliveryEstimate: "3-5 business days",
  productDetails: "",
  dimension: "",
  shippingReturn: "",
  isActive: true,
  isFeatured: false,
  variantId: null,
  materialId: null,

  selectedSeriesIds: [],
  selectedCategoryIds: [],
  selectedSubCategoryIds: [],
  selectedColors: [],
};

export const useProductForm = (propProductId?: string) => {
  const params = useParams();
  const productId = propProductId || (params?.slug as string);
  const isEditMode = Boolean(productId);
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isHydrating = useRef(isEditMode);

  // Fetch data
  const { colors } = useFetchColors({});
  const { variants } = useFetchVariants({});
  const { seriesList } = useFetchSeries({ isActive: true });
  const { materials } = useFetchMaterials({});
  const { categoryList } = useFetchCategoriesBySeriesIds(
    formData.selectedSeriesIds,
  );
  const { subCategoryList } = useFetchSubCategoriesByCategoryIds(
    formData.selectedCategoryIds,
  );

  const selectedVariant = variants.find((v) => v.id === formData.variantId);

  // Custom hooks
  const {
    sizeSelections,
    setSizeSelections,
    handleSizeFieldChange,
    calculateSizeDiscountedPrice,
    resetSizeDiscount,
    availableSizes,
  } = useSizeManagement({
    selectedColors: formData.selectedColors,
    selectedVariant,
    variantId: formData.variantId,
    basePrice: formData.basePrice,
    defaultDiscount: { type: formData.discountType, value: formData.discount },
    isEditMode,
    pageLoading,
    isHydrating,
  });

  const {
    selectedTags,
    setSelectedTags,
    searchTerm,
    setSearchTerm,
    showDropdown,
    filteredTags,
    tagExists,
    addTag,
    removeTag,
    handleCreateTag,
    toggleDropdown,
  } = useTagManagement();

  const { defaultImages, setDefaultImages, uploadIfNew, uploadMultipleImages } =
    useImageUpload();

  const {
    colorImages,
    setColorImages,
    colorUseDefault,
    setColorUseDefault,
    handleColorToggle,
    handleColorImagesChange,
    handleColorUseDefaultChange,
  } = useColorManagement({
    selectedVariant,
    basePrice: formData.basePrice,
    isEditMode,
  });

  // Fetch product for edit mode
  useEffect(() => {
    if (!isEditMode || !productId) return;

    const fetchProduct = async () => {
      try {
        const { data } = await axiosPublic.get(`/product/${productId}`);
        hydrateForm(data);
        isHydrating.current = false;
      } catch {
        toast.error("Failed to load product");
      } finally {
        setPageLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const hydrateForm = (product: Product) => {
    const seriesSet = new Set<number>();
    const categorySet = new Set<number>();
    const subCategoryIds: number[] = [];

    product.subCategories.forEach((psc: ProductSubCategory) => {
      const sub = psc.subCategory;
      subCategoryIds.push(sub.id);
      if (sub.category) {
        categorySet.add(sub.category.id);
        if (sub.category.series) seriesSet.add(sub.category.series.id);
      }
    });

    const variantId = product?.colors?.[0]?.sizes?.[0]?.size?.variantId || null;

    setFormData({
      title: product.title,
      slug: product.slug,
      sku: product.sku || "",
      basePrice: product.basePrice,
      description: product.description || "",
      brand: product.brand || "",
      weight: product.weight || 0,
      hasColorVariants: product.hasColorVariants,
      showColor: product.showColor,
      discountType: product.discountType ?? "PERCENT",
      discount: product.discount || 0,
      discountStart: product.discountStart?.split("T")[0] || "",
      discountEnd: product.discountEnd?.split("T")[0] || "",
      selectedSeriesIds: Array.from(seriesSet),
      selectedCategoryIds: Array.from(categorySet),
      selectedSubCategoryIds: subCategoryIds,
      selectedColors: product.colors?.map((c: ProductColor) => c.colorId) || [],
      variantId,
      materialId: product.materialId || null,
      note: product.note || "",
      deliveryEstimate: product.deliveryEstimate || "",
      productDetails: product.productDetails || "",
      dimension: product.dimension || "",
      shippingReturn: product.shippingReturn || "",
      isActive: product.isActive,
      isFeatured: product.isFeatured ?? false,
    });

    setDefaultImages(
      product?.images?.map((img: any) => ({
        id: img.id,
        preview: img.image,
        serialNo: img.serialNo,
        colorId: null,
        file: null,
      })) ?? [],
    );

    // Tags
    if (product.tags?.length) setSelectedTags(product.tags);

    // Color images & sizes
    const colorImgs: Record<number, any[]> = {};
    const colorSizes: Record<number, any[]> = {};
    const useDefault: Record<number, boolean> = {};

    product.colors.forEach((c: any) => {
      useDefault[c.colorId] = c.useDefaultImages ?? true;
      colorImgs[c.colorId] =
        c.images?.map((img: any) => ({
          id: img.id,
          preview: img.image,
          file: null,
        })) || [];
      colorSizes[c.colorId] =
        c.sizes?.map((s: any) => ({
          sizeId: s.sizeId,
          sku: s.sku || "",
          price: s.price || product.basePrice,
          quantity: s.quantity || 0,
          discountType: s.discountType || null, // Add this
          discount: s.discount || 0, // Add this
        })) || [];
    });

    setColorUseDefault(useDefault);
    setColorImages(colorImgs);
    setSizeSelections(colorSizes);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({ ...prev, title, slug: generateSlug(title) }));
  };

  const discountedPrice = useMemo(() => {
    if (formData.discount <= 0) return formData.basePrice;
    if (formData.discountType === "PERCENT") {
      return formData.basePrice * (1 - formData.discount / 100);
    }
    return Math.max(0, formData.basePrice - formData.discount);
  }, [formData.basePrice, formData.discount, formData.discountType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateProduct({
      formData,
      defaultImages,
      colorImages,
      sizeSelections,
      colors,
    });

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    // ... (keep your existing submit logic)
  };

  return {
    // State
    formData,
    setFormData,
    pageLoading,
    isSubmitting,
    isEditMode,
    discountedPrice,

    // Data
    colors,
    variants,
    seriesList,
    materials,
    categoryList,
    subCategoryList,
    selectedVariant,
    availableSizes,

    // Images
    defaultImages,
    setDefaultImages,
    colorImages,
    colorUseDefault,

    // Sizes
    sizeSelections,
    handleSizeFieldChange,
    calculateSizeDiscountedPrice,
    resetSizeDiscount,

    // Colors
    handleColorToggle,
    handleColorImagesChange,
    handleColorUseDefaultChange,

    // Tags
    selectedTags,
    searchTerm,
    setSearchTerm,
    showDropdown,
    filteredTags,
    tagExists,
    addTag,
    removeTag,
    handleCreateTag,
    toggleDropdown,

    // Handlers
    handleNameChange,
    handleSubmit,
    handleCancel: () => router.push(isEditMode ? "/admin/products" : "/admin"),
  };
};
