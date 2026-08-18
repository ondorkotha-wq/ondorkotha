/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Save, X, Search } from "lucide-react";
import { PageHeader } from "@/component/PageHeader/PageHeader";
import { FormSection } from "@/component/admin/Product/FormSection";
import {
  DefaultImageUploader,
  ColorImageUploader,
  ProductImageItem,
} from "@/component/admin/Product/ImageUploader";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useFetchSeries from "@/hooks/Categories/Series/useFetchSeries";
import useFetchVariants from "@/hooks/Attributes/useFetchVariants";
import useFetchColors from "@/hooks/Attributes/useFetchColors";
import useFetchCategoriesBySeriesIds from "@/hooks/Admin/Categories/useFetchCategoriesBySeriesIds";
import useFetchSubCategoriesByCategoryIds from "@/hooks/Categories/Subcategories/useFetchSubCategoriesByCategoryIds";
import GotoArrows from "@/component/Arrow/GotoArrows";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useAxiosPublic from "@/hooks/Axios/useAxiosPublic";
import { handleUploadWithCloudinary } from "@/data/handleUploadWithCloudinary";
import useFetchMaterials from "@/hooks/Attributes/useFetchMaterials";
import useFetchTags from "@/hooks/Tags/useFetchTags";
import LoadingDots from "@/component/Loading/LoadingDS";
import {
  Product,
  ProductColor,
  ProductSubCategory,
  Tag,
} from "@/types/product.types";
import VariantNSizes from "./FormComponents/VariantNSizesSection";
import BasicInfoSection from "./FormComponents/BasicInfoSection";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductFormData {
  title: string;
  slug: string;
  sku?: string;
  basePrice: number;
  description?: string;
  brand?: string;
  hasColorVariants: boolean;
  showColor: boolean;
  discountType?: "PERCENT" | "FIXED";
  discount: number;
  discountStart: string;
  discountEnd: string;
  weight: number;

  selectedSeriesIds: number[];
  selectedCategoryIds: number[];
  selectedSubCategoryIds: number[];

  selectedColors: number[];
  variantId: number | null;
  materialId?: number | null;

  note: string;
  deliveryEstimate: string;
  productDetails: string;
  dimension: string;
  shippingReturn: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface SizeDetail {
  sizeId: number;
  sku?: string;
  price?: number;
  quantity: number;
  discountType?: "PERCENT" | "FIXED" | null; // Add discount fields
  discount?: number;
  trackingMode?: "LEGACY_QUANTITY" | "PIECE_BARCODE";
}

type UploadedImage =
  | { url: string; serialNo: number; alt?: string; colorId?: never }
  | { url: string; colorId: number; serialNo?: never; alt?: never };

type ColorImageMap = Record<number, string[]>;

type ProductColorCreateInput = {
  colorId: number;
  sizes?: { sizeId: number; sku?: string; price?: number; quantity: number }[];
  useDefaultImages?: boolean;
  images?: string[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const defaultShippingReturn = `Shipping:
• Standard shipping: 5-7 business days
• Express shipping: 2-3 business days
• Free shipping on orders over ৳50

Returns:
• 30-day return policy
• Items must be unworn with original tags
• Free returns for store credit`;

const initialFormData: ProductFormData = {
  title: "",
  slug: "",
  sku: "",
  basePrice: 0,
  description: "",
  brand: "",
  hasColorVariants: true,
  showColor: true,
  weight: 0.5,
  discountType: "PERCENT",
  discount: 0,
  discountStart: new Date().toISOString().split("T")[0],
  discountEnd: new Date().toISOString().split("T")[0],
  selectedSeriesIds: [],
  selectedCategoryIds: [],
  selectedSubCategoryIds: [],
  selectedColors: [],
  variantId: null,
  materialId: null,
  note: "",
  deliveryEstimate: "3-5 business days",
  productDetails: "",
  dimension: "",
  shippingReturn: defaultShippingReturn,
  isActive: true,
  isFeatured: false,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  /** Pass a productId / slug to switch to "edit" mode; omit for "create" mode */
  propProductId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProductForm = ({ propProductId }: ProductFormProps) => {
  const params = useParams();
  const productId = propProductId || (params?.slug as string);
  const isEditMode = Boolean(productId);
  const router = useRouter();
  const axiosSecure = useAxiosSecure();
  const axiosPublic = useAxiosPublic();

  // Loading states
  const [pageLoading, setPageLoading] = useState(isEditMode); // only true in edit mode while fetching
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydration guard – prevents size-reset effect from running during initial data load
  const isHydrating = React.useRef(isEditMode);

  // Track whether color/size/image data was actually changed by the user
  // Only send `colors` in the update payload when true, to avoid triggering
  // the backend's cart-conflict guard unnecessarily
  const colorsChanged = React.useRef(!isEditMode);

  // Track unsaved changes to warn before tab close / in-app navigation
  const isDirty = React.useRef(false);

  // ─── Form state ──────────────────────────────────────────────────────────
  const [formData, _setFormData] = useState<ProductFormData>(initialFormData);
  const setFormData = (updater: React.SetStateAction<ProductFormData>) => {
    if (!isHydrating.current) isDirty.current = true;
    _setFormData(updater);
  };

  // ─── Tag state ───────────────────────────────────────────────────────────
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ─── Image / size state ──────────────────────────────────────────────────
  const [sizeSelections, setSizeSelections] = useState<{
    [colorId: number]: SizeDetail[];
  }>({});
  const [defaultImages, _setDefaultImages] = useState<ProductImageItem[]>([]);
  const setDefaultImages = (updater: React.SetStateAction<ProductImageItem[]>) => {
    if (!isHydrating.current) isDirty.current = true;
    _setDefaultImages(updater);
  };
  const [colorImages, setColorImages] = useState<
    Record<number, ProductImageItem[]>
  >({});
  const [colorUseDefault, setColorUseDefault] = useState<
    Record<number, boolean>
  >({});

  // ─── Hooks ───────────────────────────────────────────────────────────────
  const { colors, isLoading: colorsLoading } = useFetchColors({});
  const { variants, isLoading: variantsLoading } = useFetchVariants({});
  const { seriesList } = useFetchSeries({ isActive: true });
  const { materials } = useFetchMaterials({});
  const { tags, refetch: refetchTags } = useFetchTags();

  const { categoryList, isLoading: categoriesLoading } =
    useFetchCategoriesBySeriesIds(formData.selectedSeriesIds);
  const { subCategoryList, isLoading: subCategoriesLoading } =
    useFetchSubCategoriesByCategoryIds(formData.selectedCategoryIds);

  const selectedVariant = variants.find((v) => v.id === formData.variantId);
  const availableSizes = selectedVariant?.sizes || [];

  // ─── Fetch product for edit mode ─────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !productId) return;

    const fetchProduct = async () => {
      try {
        const { data } = await axiosPublic.get(`/product/${productId}?admin=true`);
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

  // ─── Warn before tab close / browser refresh with unsaved changes ─────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ─── Hydrate form with existing product data ──────────────────────────────
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
      weight: product.weight || 0.5,
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
        id: String(img.id),
        preview: img.image,
        serialNo: img.serialNo,
        alt: img.alt ?? "",
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
        c.images?.map((img: any, idx: number) => ({
          id: String(img.id),
          preview: img.image,
          file: null,
          colorId: c.colorId,
          serialNo: idx + 1,
        })) || [];
      colorSizes[c.colorId] =
        c.sizes?.map((s: any) => ({
          sizeId: s.sizeId,
          sku: s.sku || "",
          price: s.price || product.basePrice,
          quantity: s.quantity || 0,
          discountType: s.discountType || null, // Add this
          discount: s.discount || 0, // Add this
          trackingMode: s.trackingMode,
        })) || [];
    });

    setColorUseDefault(useDefault);
    setColorImages(colorImgs);
    setSizeSelections(colorSizes);
  };

  useEffect(() => {
    const isHydratingNow = isEditMode && (pageLoading || isHydrating.current);

    if (isHydratingNow || !selectedVariant) return;

    setSizeSelections((prev) => {
      const variantSizes = selectedVariant.sizes || [];

      const next: Record<number, SizeDetail[]> = {};

      formData.selectedColors.forEach((colorId) => {
        const existing = prev[colorId] || [];

        const existingMap = new Map(existing.map((s) => [s.sizeId, s]));

        next[colorId] = variantSizes.map((size) => {
          return (
            existingMap.get(size.id) ?? {
              sizeId: size.id,
              sku: "",
              price: formData.basePrice,
              quantity: 0,
              discountType: null,
              discount: 0,
            }
          );
        });
      });

      // shallow compare
      const same = JSON.stringify(prev) === JSON.stringify(next);

      return same ? prev : next;
    });
  }, [formData.selectedColors, selectedVariant, isEditMode, pageLoading]);

  // Sync product discount to sizes when product discount changes (but not vice versa)
  useEffect(() => {
    // Skip during hydration
    if (isHydrating.current || !formData.variantId) return;

    setSizeSelections((prev) => {
      const next = { ...prev };
      let changed = false;

      formData.selectedColors.forEach((colorId) => {
        if (next[colorId]) {
          next[colorId] = next[colorId].map((size) => {
            // Only update if size doesn't have its own discount
            if (!size.discountType || size.discountType === null) {
              changed = true;
              return {
                ...size,
                discountType: formData.discountType,
                discount: formData.discount,
              };
            }
            return size;
          });
        }
      });

      return changed ? next : prev;
    });
  }, [
    formData.discountType,
    formData.discount,
    formData.selectedColors,
    formData.variantId,
  ]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();

  // calculate discounted price
  const calculateSizeDiscountedPrice = (size: SizeDetail) => {
    const basePrice = size.price || formData.basePrice;

    if (!size.discount || size.discount <= 0 || !size.discountType) {
      return basePrice;
    }

    if (size.discountType === "PERCENT") {
      return basePrice * (1 - size.discount / 100);
    } else {
      return Math.max(0, basePrice - size.discount);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({ ...prev, title, slug: generateSlug(title) }));
  };

  const getSeriesName = (id: number) =>
    seriesList.find((s) => s.id === id)?.name || "";
  const getCategoryName = (id: number) =>
    categoryList.find((c) => c.id === id)?.name || "";

  // ─── Toggle handlers ─────────────────────────────────────────────────────
  const handleSeriesToggle = (seriesId: number) => {
    setFormData((prev) => {
      const isSelected = prev.selectedSeriesIds.includes(seriesId);
      const newSeriesIds = isSelected
        ? prev.selectedSeriesIds.filter((id) => id !== seriesId)
        : [...prev.selectedSeriesIds, seriesId];

      const validCategoryIds = categoryList
        .filter((c) => newSeriesIds.includes(c.seriesId))
        .map((c) => c.id);

      return {
        ...prev,
        selectedSeriesIds: newSeriesIds,
        selectedCategoryIds: prev.selectedCategoryIds.filter((id) =>
          validCategoryIds.includes(id),
        ),
      };
    });
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData((prev) => {
      const isSelected = prev.selectedCategoryIds.includes(categoryId);
      const newCategoryIds = isSelected
        ? prev.selectedCategoryIds.filter((id) => id !== categoryId)
        : [...prev.selectedCategoryIds, categoryId];

      const validSubCategoryIds = subCategoryList
        .filter((sc) => newCategoryIds.includes(sc.categoryId))
        .map((sc) => sc.id);

      return {
        ...prev,
        selectedCategoryIds: newCategoryIds,
        selectedSubCategoryIds: prev.selectedSubCategoryIds.filter((id) =>
          validSubCategoryIds.includes(id),
        ),
      };
    });
  };

  const handleSubCategoryToggle = (subCategoryId: number) => {
    setFormData((prev) => {
      const isSelected = prev.selectedSubCategoryIds.includes(subCategoryId);
      return {
        ...prev,
        selectedSubCategoryIds: isSelected
          ? prev.selectedSubCategoryIds.filter((id) => id !== subCategoryId)
          : [...prev.selectedSubCategoryIds, subCategoryId],
      };
    });
  };

  const handleColorToggle = (colorId: number) => {
    const isSelected = formData.selectedColors.includes(colorId);
    colorsChanged.current = true;

    setFormData((prev) => ({
      ...prev,
      selectedColors: isSelected
        ? prev.selectedColors.filter((id) => id !== colorId)
        : [...prev.selectedColors, colorId],
    }));

    if (!isSelected) {
      // Init sizes if not already present
      // if (!sizeSelections[colorId] && selectedVariant?.sizes) {
      //   setSizeSelections((prev) => ({
      //     ...prev,
      //     [colorId]: (selectedVariant.sizes || []).map((s) => ({
      //       sizeId: s.id,
      //       sku: "",
      //       price: formData.basePrice || undefined,
      //       quantity: 0,
      //       discountType: null, // Add this
      //       discount: 0, // Add this
      //     })),
      //   }));
      // }
      if (!colorImages[colorId]) {
        setColorImages((prev) => ({ ...prev, [colorId]: [] }));
        setColorUseDefault((prev) => ({ ...prev, [colorId]: true }));
      }
    }
    // else if (!isEditMode) {
    //   // In create mode, clean up sizes on deselect
    //   setSizeSelections((prev) => {
    //     const next = { ...prev };
    //     delete next[colorId];
    //     return next;
    //   });
    // }
  };

  const handleSizeFieldChange = (
    colorId: number,
    sizeId: number,
    field: keyof SizeDetail,
    value: string | number | null,
  ) => {
    colorsChanged.current = true;
    isDirty.current = true;
    setSizeSelections((prev) => {
      if (!prev[colorId]) return prev;

      return {
        ...prev,
        [colorId]: prev[colorId].map((size) =>
          size.sizeId === sizeId
            ? {
                ...size,
                [field]:
                  field === "quantity"
                    ? Math.max(0, Number(value) || 0)
                    : field === "discount"
                      ? Number(value)
                      : value,
              }
            : size,
        ),
      };
    });
  };

  const handleColorImagesChange = (
    colorId: number,
    images: ProductImageItem[],
  ) => {
    colorsChanged.current = true;
    isDirty.current = true;
    setColorImages((prev) => ({ ...prev, [colorId]: images }));
  };

  const handleColorUseDefaultChange = (colorId: number, useDefault: boolean) => {
    colorsChanged.current = true;
    isDirty.current = true;
    setColorUseDefault((prev) => ({ ...prev, [colorId]: useDefault }));
  };

  const handleDiscountTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value as "PERCENT" | "FIXED";

    colorsChanged.current = true;
    setFormData((prev) => ({
      ...prev,
      discountType: value,
    }));

    setSizeSelections((prev) => {
      let changed = false;

      const next = Object.fromEntries(
        Object.entries(prev).map(([colorId, sizes]) => [
          Number(colorId),
          sizes.map((size) => {
            // only update inherited discounts
            // if (!size.discountType) {
            changed = true;
            return {
              ...size,
              discountType: value,
            };
            // }
            return size;
          }),
        ]),
      );

      return changed ? next : prev;
    });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? 0 : Number(e.target.value);

    colorsChanged.current = true;
    setFormData((prev) => ({
      ...prev,
      discount: value,
    }));

    setSizeSelections((prev) => {
      let changed = false;

      const next = Object.fromEntries(
        Object.entries(prev).map(([colorId, sizes]) => [
          Number(colorId),
          sizes.map((size) => {
            // if (!size.discountType) {
            changed = true;
            return {
              ...size,
              discount: value,
            };
            // }
            return size;
          }),
        ]),
      );

      return changed ? next : prev;
    });
  };

  const handleDiscountStartChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      discountStart: e.target.value,
    }));
  };

  const handleDiscountEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      discountEnd: e.target.value,
    }));
  };

  // ─── Tag handlers ─────────────────────────────────────────────────────────
  const filteredTags = tags.filter((tag: any) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const tagExists = tags.some(
    (tag: any) => tag.name.toLowerCase() === searchTerm.toLowerCase(),
  );

  const addTag = (tag: Tag) => {
    if (selectedTags.length >= 10 || selectedTags.find((t) => t.id === tag.id))
      return;
    isDirty.current = true;
    setSelectedTags((prev) => [...prev, tag]);
    setShowDropdown(false);
  };

  const removeTag = (id: number) => {
    isDirty.current = true;
    setSelectedTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateTag = async () => {
    if (!searchTerm.trim() || selectedTags.length >= 10) return;
    const res = await axiosSecure.post("tags", {
      name: searchTerm.trim().toLowerCase(),
    });
    refetchTags();
    setSelectedTags((prev) => [...prev, res.data]);
    setSearchTerm("");
  };

  // ─── Image upload helper ─────────────────────────────────────────────────
  const uploadIfNew = async (img: ProductImageItem): Promise<string> => {
    if (!img.file) return img.preview as string;
    return await handleUploadWithCloudinary(img.file);
  };

  // ─── Validation ──────────────────────────────────────────────────────────
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return "Product title is required";
    if (formData.basePrice <= 0) return "Price must be greater than 0";
    if (formData.selectedSubCategoryIds.length === 0)
      return "Please select at least one subcategory";

    const hasImages =
      defaultImages.length > 0 ||
      Object.values(colorImages).some((imgs) => imgs.length > 0);
    if (!hasImages) return "Please upload at least one product image";

    if (formData.hasColorVariants && !formData.variantId)
      return "Please select a variant type";

    if (formData.hasColorVariants) {
      for (const colorId of formData.selectedColors) {
        const sizes = sizeSelections[colorId] || [];
        if (sizes.length === 0) {
          const color = colors.find((c) => c.id === colorId);
          return `Color "${color?.name}" must have at least one size`;
        }
        if (sizes.some((s) => s.quantity < 0)) {
          const color = colors.find((c) => c.id === colorId);
          return `Color "${color?.name}" has a size with a negative quantity`;
        }
      }
    }

    // Validate discount dates
    if (formData.discount > 0) {
      if (new Date(formData.discountStart) > new Date(formData.discountEnd)) {
        return "Discount end date must be after start date";
      }
    }

    // Validate size-specific discounts
    for (const colorId of formData.selectedColors) {
      const sizes = sizeSelections[colorId] || [];
      for (const size of sizes) {
        if (size.discountType && size.discount) {
          if (size.discountType === "PERCENT" && size.discount > 100) {
            return `Size discount percentage cannot exceed 100%`;
          }
          if (
            size.discountType === "FIXED" &&
            size.discount > (size.price || formData.basePrice)
          ) {
            return `Fixed discount cannot exceed the price`;
          }
        }
      }
    }

    return null;
  };

  // ─── Discounted price preview ─────────────────────────────────────────────
  const discountedPrice = useMemo(() => {
    if (formData.discount <= 0) return formData.basePrice;
    if (formData.discountType === "PERCENT") {
      return formData.basePrice * (1 - formData.discount / 100);
    }
    return Math.max(0, formData.basePrice - formData.discount);
  }, [formData.basePrice, formData.discount, formData.discountType]);

  const handleTagDropDown = () => {
    setShowDropdown(!showDropdown);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // ── UPDATE ──
        const defaultImageUrls = await Promise.all(
          defaultImages.map(async (img) => ({
            image: await uploadIfNew(img),
            serialNo: img.serialNo,
            alt: img.alt?.trim() || undefined,
          })),
        );

        // Only rebuild and send colors when user actually changed color/size/image data.
        // Skipping this avoids the backend's cart-conflict guard for unrelated edits.
        const colorVariants = colorsChanged.current
          ? await Promise.all(
              formData.selectedColors.map(async (colorId) => {
                const images = colorUseDefault[colorId]
                  ? []
                  : await Promise.all(
                      (colorImages[colorId] || []).map(uploadIfNew),
                    );

                const sizes = (sizeSelections[colorId] || [])
                  .map((size) => ({
                    sizeId: size.sizeId,
                    sku: size.sku || "",
                    price: Number(size.price) || Number(formData.basePrice),
                    quantity: Math.max(0, Number(size.quantity) || 0),
                    discountType: size.discountType,
                    discount: size.discount,
                  }));

                return {
                  colorId,
                  useDefaultImages: colorUseDefault[colorId],
                  images,
                  sizes,
                };
              }),
            )
          : undefined;

        const payload = {
          title: formData.title,
          slug: formData.slug,
          sku: formData.sku || undefined,
          basePrice: Number(formData.basePrice),
          description: formData.description || undefined,
          brand: formData.brand || undefined,
          hasColorVariants: formData.hasColorVariants,
          showColor: formData.showColor,
          weight: Number(formData.weight),
          discountType: formData.discountType,
          discount: Number(formData.discount),
          discountStart:
            Number(formData.discount) > 0 && formData.discountStart
              ? new Date(formData.discountStart)
              : null,
          discountEnd:
            Number(formData.discount) > 0 && formData.discountEnd
              ? new Date(formData.discountEnd)
              : null,
          note: formData.note || undefined,
          deliveryEstimate: formData.deliveryEstimate || undefined,
          productDetails: formData.productDetails || undefined,
          dimension: formData.dimension || undefined,
          shippingReturn: formData.shippingReturn || undefined,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          materialId: formData.materialId || undefined,
          images: defaultImageUrls,
          ...(colorVariants !== undefined && { colors: colorVariants }),
          subCategories: formData.selectedSubCategoryIds,
          tags: selectedTags.map((t) => t.id),
        };

        await axiosSecure.patch(`/product/${productId}`, payload);
        isDirty.current = false;
        toast.success("Product updated successfully");
      } else {
        // ── CREATE ──
        const uploadPromises = [
          ...defaultImages.map(async (img) => {
            if (!img.file) return null;
            const url = await handleUploadWithCloudinary(img.file);
            return { url, serialNo: img.serialNo, alt: img.alt?.trim() || undefined };
          }),
          ...formData.selectedColors.flatMap((colorId) =>
            colorUseDefault[colorId]
              ? []
              : (colorImages[colorId] || []).map(async (img) => {
                  if (!img.file) return null;
                  const url = await handleUploadWithCloudinary(img.file);
                  return { url, colorId };
                }),
          ),
        ];

        const uploadedImages = (await Promise.all(uploadPromises)).filter(
          Boolean,
        ) as UploadedImage[];

        const defaultImageUrls = uploadedImages
          .filter(
            (img): img is Extract<UploadedImage, { serialNo: number }> =>
              "serialNo" in img,
          )
          .map((img) => ({
            image: img.url,
            serialNo: img.serialNo,
            alt: img.alt,
          }));

        const colorImageMap = uploadedImages
          .filter(
            (img): img is Extract<UploadedImage, { colorId: number }> =>
              "colorId" in img,
          )
          .reduce<ColorImageMap>((acc, img) => {
            if (!acc[img.colorId]) acc[img.colorId] = [];
            acc[img.colorId].push(img.url);
            return acc;
          }, {});

        const colorVariants: ProductColorCreateInput[] =
          formData.selectedColors.map((colorId) => {
            const colorData: ProductColorCreateInput = { colorId };

            if (!colorUseDefault[colorId] && colorImageMap[colorId]) {
              colorData.images = [...colorImageMap[colorId]];
              colorData.useDefaultImages = false;
            } else {
              colorData.useDefaultImages = true;
            }

            const sizes = sizeSelections[colorId] || [];
            if (sizes.length > 0) {
              colorData.sizes = sizes.map((size) => ({
                sizeId: size.sizeId,
                sku: size.sku || "",
                price: Number(size.price) || Number(formData.basePrice),
                quantity: Math.max(0, Number(size.quantity) || 0),
                discountType: size.discountType,
                discount: size.discount,
              }));
            }

            return colorData;
          });

        const submitData = {
          title: formData.title,
          slug: formData.slug,
          sku: formData.sku || undefined,
          basePrice: formData.basePrice,
          description: formData.description || undefined,
          brand: formData.brand || undefined,
          hasColorVariants: formData.hasColorVariants,
          weight: formData.weight,
          showColor: formData.showColor,
          discountType: formData.discountType,
          discount: formData.discount,
          discountStart:
            Number(formData.discount) > 0 && formData.discountStart
              ? new Date(formData.discountStart)
              : undefined,
          discountEnd:
            Number(formData.discount) > 0 && formData.discountEnd
              ? new Date(formData.discountEnd)
              : undefined,
          note: formData.note || undefined,
          deliveryEstimate: formData.deliveryEstimate || undefined,
          productDetails: formData.productDetails || undefined,
          dimension: formData.dimension || undefined,
          shippingReturn: formData.shippingReturn || undefined,
          isActive: formData.isActive,
          materialId: formData.materialId || undefined,
          isFeatured: formData.isFeatured,
          tags: selectedTags.map((t) => t.id),
          subCategories: [...formData.selectedSubCategoryIds],
          colors: colorVariants,
          images: [...defaultImageUrls],
        };

        const { data } = await axiosSecure.post("/products", submitData);
        isDirty.current = false;

        const generated = data?.pieceGeneration?.generated ?? [];
        if (generated.length > 0) {
          const totalPieces = generated.reduce(
            (sum: number, g: { quantity: number }) => sum + g.quantity,
            0,
          );
          const printUrl = `/admin/pieces?tab=generate&search=${encodeURIComponent(formData.title)}`;
          toast.success(
            (t) => (
              <span>
                Product created — {totalPieces} barcode
                {totalPieces === 1 ? "" : "s"} generated across{" "}
                {generated.length} size{generated.length === 1 ? "" : "s"}.
                Stock is 0 until an Inventory Manager scans them in.{" "}
                <a
                  href={printUrl}
                  onClick={() => toast.dismiss(t.id)}
                  className="underline font-semibold"
                >
                  Print barcodes →
                </a>
              </span>
            ),
            { duration: 8000 },
          );
        } else {
          toast.success("Product created successfully!");
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(
        error.response?.data?.message ||
          (isEditMode ? "Update failed" : "Failed to create product"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading screen (edit mode only) ─────────────────────────────────────
  if (pageLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={isEditMode ? "Update Product" : "Add New Product"}
          subtitle={
            isEditMode
              ? "Edit existing product details"
              : "Create a new product with all details"
          }
          backLink={isEditMode ? "/admin/products" : "/admin"}
        />

        {isEditMode && formData.slug && (
          <div className="flex justify-end -mt-4 mb-2">
            <Link
              href={`/admin/cms/seo?url=${encodeURIComponent(`/products/${formData.slug}`)}`}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <Search size={12} />
              Manage SEO for this page
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Basic Information ── */}
          <BasicInfoSection
            formData={formData}
            setFormData={setFormData}
            generateSlug={generateSlug}
            handleNameChange={handleNameChange}
          />

          {/* ── Categories ── */}
          <FormSection
            title="Categories"
            description="Select multiple series, categories, and subcategories"
          >
            <div className="space-y-6">
              {/* Series */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Series (select multiple)
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {seriesList?.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSeriesToggle(s.id)}
                      className={`px-4 py-2 rounded-lg gray-border text-sm font-medium transition-all ${
                        formData.selectedSeriesIds.includes(s.id)
                          ? "border-blue-200 bg-blue-200 text-blue-200-foreground"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {formData.selectedSeriesIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categories (select multiple)
                  </label>
                  {categoriesLoading ? (
                    <div className="text-muted-foreground text-sm">
                      <LoadingDots />
                    </div>
                  ) : categoryList.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categoryList?.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleCategoryToggle(c.id)}
                          className={`px-4 py-2 rounded-lg gray-border text-sm font-medium transition-all ${
                            formData.selectedCategoryIds.includes(c.id)
                              ? "border-blue-200 bg-blue-200 text-blue-200-foreground"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <span className="text-xs opacity-60 mr-1">
                            {getSeriesName(c.seriesId)}:
                          </span>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      No categories available
                    </div>
                  )}
                </div>
              )}

              {/* Subcategories */}
              {formData.selectedCategoryIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategories (select multiple) *
                  </label>
                  {subCategoriesLoading ? (
                    <div className="text-muted-foreground text-sm">
                      <LoadingDots />
                    </div>
                  ) : subCategoryList.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subCategoryList?.map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => handleSubCategoryToggle(sc.id)}
                          className={`px-4 py-2 rounded-lg gray-border text-sm font-medium transition-all ${
                            formData.selectedSubCategoryIds.includes(sc.id)
                              ? "border-blue-200 bg-blue-200 text-blue-200-foreground"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <span className="text-xs opacity-60 mr-1">
                            {getCategoryName(sc.categoryId)}:
                          </span>
                          {sc.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      No subcategories available
                    </div>
                  )}
                </div>
              )}

              {/* Selected summary */}
              {formData.selectedSubCategoryIds.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected subcategories:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedSubCategoryIds.map((id) => {
                      const sc = subCategoryList.find((s) => s.id === id);
                      const cat = categoryList.find(
                        (c) => c.id === sc?.categoryId,
                      );
                      return sc ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {cat?.name} → {sc.name}
                          <button
                            type="button"
                            onClick={() => handleSubCategoryToggle(id)}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* ── Colors ── */}
          <FormSection
            title="Colors"
            description="Select available colors for this product"
          >
            {colorsLoading ? (
              <div className="text-muted-foreground">
                <LoadingDots />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {colors?.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleColorToggle(color.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg gray-border transition-all ${
                      formData.selectedColors.includes(color.id)
                        ? "border-blue-200 bg-blue-200"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-border shadow-sm overflow-hidden shrink-0"
                      style={{ backgroundColor: color.hexCode }}
                    >
                      {color.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={color.image}
                          alt={color.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── Product Images ── */}
          <FormSection
            title="Product Images"
            description="Upload default images and optionally add color-specific images"
          >
            <div className="space-y-6">
              <DefaultImageUploader
                images={defaultImages}
                onImagesChange={setDefaultImages}
              />

              {formData.selectedColors.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">
                    Color-specific Images
                  </h4>
                  {formData.selectedColors.map((colorId) => {
                    const color = colors.find((c) => c.id === colorId);
                    if (!color) return null;
                    return (
                      <ColorImageUploader
                        key={colorId}
                        colorId={colorId}
                        color={color}
                        images={colorImages[colorId] || []}
                        defaultImages={defaultImages}
                        useDefault={colorUseDefault[colorId] ?? true}
                        onImagesChange={handleColorImagesChange}
                        onUseDefaultChange={handleColorUseDefaultChange}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </FormSection>

          {/* ── Discount ── */}
          <FormSection
            title="Price"
            description="Set up product discount (applies to all sizes by default)"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* {isEditMode && ( */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={formData.discountType || "PERCENT"}
                  onChange={handleDiscountTypeChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              {/* )} */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.discountType === "FIXED"
                    ? " Discount Amount"
                    : " Discount (%)"}
                </label>
                <input
                  type="number"
                  value={formData.discount || ""}
                  onChange={handleDiscountChange}
                  placeholder="0"
                  min="0"
                  max={formData.discountType === "PERCENT" ? 100 : undefined}
                  // step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This applies to all sizes by default. Override per size below.
                </p>
              </div>

              {/* {isEditMode && ( */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Price
                </label>
                <input
                  type="text"
                  value={`৳${discountedPrice.toFixed(2)}`}
                  disabled
                  className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                />
              </div>
              {/* )} */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.discountStart}
                  onChange={handleDiscountStartChange}
                  disabled={!formData.discount || formData.discount <= 0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.discountEnd}
                  onChange={handleDiscountEndChange}
                  disabled={!formData.discount || formData.discount <= 0}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Variant & Sizes ── */}
          <VariantNSizes
            formData={formData}
            variants={variants}
            variantsLoading={variantsLoading}
            colors={colors}
            sizeSelections={sizeSelections}
            availableSizes={availableSizes}
            setFormData={setFormData}
            handleSizeFieldChange={handleSizeFieldChange}
            calculateSizeDiscountedPrice={calculateSizeDiscountedPrice}
            setSizeSelections={setSizeSelections}
            isEditMode={isEditMode}
          />

          {/* ── Additional Details ── */}
          <FormSection
            title="Additional Details"
            description="Optional product information"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Material */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <select
                    value={formData.materialId || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        materialId: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Material --</option>
                    {materials?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div
                  className="gray-border rounded-md p-2 flex flex-wrap gap-2 cursor-text"
                  onClick={handleTagDropDown}
                >
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-gray-200 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag.name}
                      <button type="button" onClick={() => removeTag(tag.id)}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 outline-none text-sm"
                    placeholder="Add tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                  />
                </div>

                {showDropdown && (
                  <div className="z-10 mt-1 w-full bg-white gray-border rounded-md max-h-60 overflow-y-auto shadow">
                    {filteredTags.map((tag: any) => (
                      <div
                        key={tag.id}
                        onClick={() => addTag(tag)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {tag.name}
                      </div>
                    ))}
                    {searchTerm && !tagExists && (
                      <div
                        onClick={handleCreateTag}
                        className="px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 cursor-pointer"
                      >
                        + Create &quot;{searchTerm}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Internal)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Internal notes about this product..."
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryEstimate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryEstimate: e.target.value,
                      }))
                    }
                    placeholder="3-5 business days"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.dimension}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dimension: e.target.value,
                      }))
                    }
                    placeholder="e.g., 10x20x5 cm"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Details (Optional)
                </label>
                <textarea
                  value={formData.productDetails}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      productDetails: e.target.value,
                    }))
                  }
                  placeholder="Detailed product description, materials, care instructions..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping & Return Policy
                </label>
                <textarea
                  value={formData.shippingReturn}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shippingReturn: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono"
                />
              </div>
            </div>
          </FormSection>

          {/* ── Status ── */}
          <FormSection title="Status">
            {isEditMode ? (
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Product Status
                </label>
                <select
                  value={formData.isActive ? "1" : "0"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.value === "1",
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (visible to customers)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isFeatured: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isFeatured" className="text-sm text-gray-700">
                    Featured Product (show in featured product)
                  </label>
                </div>
              </>
            )}
          </FormSection>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => {
                if (
                  isDirty.current &&
                  !window.confirm(
                    "You have unsaved changes. Leave without saving?",
                  )
                )
                  return;
                router.push(isEditMode ? "/admin/products" : "/admin");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>

        <GotoArrows />
      </div>
    </div>
  );
};

export default ProductForm;
