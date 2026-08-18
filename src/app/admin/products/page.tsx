/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useFetchProducts from "@/hooks/Products/useFetchProducts";
import { FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import LoadingDots from "@/component/Loading/LoadingDS";
import {
  Product,
  ProductColor,
  ProductSize,
  SubCategoryRelation,
} from "@/types/product.types";
import { Search } from "lucide-react";

const PRODUCTS_PER_PAGE = 10;

const AllProducts = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const axiosSecure = useAxiosSecure();

  const { products, meta, isLoading, isFetching, refetch } = useFetchProducts({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    search: search || undefined,
    isActive,
    includeOutOfStock: true,
  });

  // Calculate stock safely
  const calculateStock = (product: Product) => {
    if (!product.colors || !Array.isArray(product.colors)) return 0;

    return product.colors.reduce((sum: number, color: ProductColor) => {
      if (!color.sizes || !Array.isArray(color.sizes)) return sum;
      const colorStock = color.sizes.reduce(
        (sizeSum: number, size: ProductSize) => {
          return sizeSum + (size.quantity || 0);
        },
        0,
      );
      return sum + colorStock;
    }, 0);
  };

  // Get first image safely
  const getFirstImage = (product: Product) => {
    if (
      !product.images ||
      !Array.isArray(product.images) ||
      product.images.length === 0
    ) {
      return "/placeholder.jpg";
    }

    const sortedImages = [...product.images].sort(
      (a, b) => (a.serialNo || 0) - (b.serialNo || 0),
    );
    return sortedImages[0]?.image || "/placeholder.jpg";
  };

  // Handle View Product
  const handleView = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  // Handle Edit Product
  const handleEdit = (productId: string) => {
    router.push(`/admin/products/update/${productId}`);
  };

  const handleBarcode = (product: Product) => {
    const params = new URLSearchParams({ search: product.title });
    router.push(`/admin/pieces?${params.toString()}`);
  };

  // Handle Toggle Product Status (Enable/Disable)
  const handleToggleStatus = async (productId: string) => {
    try {
      setTogglingId(productId);

      const response = await axiosSecure.patch(
        `/product/${productId}/toggle-status`,
      );

      //   console.log(response.data);

      // Refetch products to update the list
      await refetch();

      // Optional: Show success toast/notification
      // toast.success(`Product ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error("Error toggling product status:", error);
      // Optional: Show error toast/notification
      // toast.error("Failed to update product status");
    } finally {
      setTogglingId(null);
    }
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setCurrentPage(1);
    if (value === "") {
      setIsActive(null);
    } else {
      setIsActive(value === "true");
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setIsActive(null);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">All Products</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by title or SKU..."
            className="w-full gray-border rounded-md px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => {
              setCurrentPage(1);
              setSearch(e.target.value);
            }}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search />
          </div>
        </div>

        <select
          className="gray-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          value={isActive === null ? "" : isActive ? "true" : "false"}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {(search || isActive !== null) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Loading overlay */}
      {isFetching && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left text-sm text-gray-600">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center">
                    <LoadingDots />
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center">
                    {/* <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">📦</span>
                    </div> */}
                    <p className="text-lg font-medium mb-1">
                      No products found
                    </p>
                    <p className="text-gray-600">
                      {search
                        ? `No products matching "${search}"`
                        : "Try adjusting your filters or add new products"}
                    </p>
                    {(search || isActive !== null) && (
                      <button
                        onClick={clearFilters}
                        className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              products?.map((product, index) => {
                const stock = calculateStock(product);
                const imageUrl = getFirstImage(product);

                return (
                  <tr
                    key={product.id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      {(meta.page - 1) * meta.limit + index + 1}
                    </td>

                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-12 h-12 rounded object-cover border border-gray-200 bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.jpg";
                        }}
                      />
                      <div>
                        <span className="font-medium text-gray-800 block">
                          {product.title}
                        </span>
                        {product.subCategories &&
                          product.subCategories.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {product?.subCategories
                                ?.map(
                                  (sc: SubCategoryRelation) =>
                                    sc.subCategory?.name,
                                )
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        {product.slug}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium">
                      ৳ {product.basePrice || 0}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stock > 20
                            ? "bg-green-100 text-green-700"
                            : stock > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {stock} pcs
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleView(product.slug)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(product.slug)}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                          title="Edit Product"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleBarcode(product)}
                          className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                        >
                          Barcode
                        </button>
                        <button
                          onClick={() => handleToggleStatus(product.slug)}
                          disabled={togglingId === product.slug}
                          className={`text-sm font-medium disabled:opacity-50 ${
                            product.isActive
                              ? "text-red-600 hover:text-red-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                          title={
                            product.isActive
                              ? "Disable Product"
                              : "Enable Product"
                          }
                        >
                          {togglingId === product.slug
                            ? "..."
                            : product.isActive
                              ? "Disable"
                              : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <LoadingDots />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No products found
          </div>
        ) : (
          products?.map((product, index) => {
            const stock = calculateStock(product);
            const imageUrl = getFirstImage(product);

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-3"
              >
                {/* Top */}
                <div className="flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="w-14 h-14 rounded object-cover border"
                  />

                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      product.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="font-medium">৳ {product.basePrice || 0}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Stock</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        stock > 20
                          ? "bg-green-100 text-green-700"
                          : stock > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stock} pcs
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-2 border-t text-sm">
                  <button
                    onClick={() => handleView(product.slug)}
                    className="text-blue-600 font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(product.slug)}
                    className="text-yellow-600 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleBarcode(product)}
                    className="text-violet-600 font-medium"
                  >
                    Barcode
                  </button>
                  <button
                    onClick={() => handleToggleStatus(product.slug)}
                    disabled={togglingId === product.slug}
                    className={`font-medium disabled:opacity-50 ${
                      product.isActive ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {togglingId === product.slug
                      ? "..."
                      : product.isActive
                        ? "Disable"
                        : "Enable"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Enhanced Pagination */}
      {meta?.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            products
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={meta.page === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                let pageNum;
                if (meta.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (meta.page <= 3) {
                  pageNum = i + 1;
                } else if (meta.page >= meta.totalPages - 2) {
                  pageNum = meta.totalPages - 4 + i;
                } else {
                  pageNum = meta.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md ${
                      meta.page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={meta.page === meta.totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))
              }
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed
               hover:bg-gray-50"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Page {meta.page} of {meta.totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProducts;
