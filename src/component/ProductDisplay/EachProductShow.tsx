/* eslint-disable react-hooks/purity */
/* eslint-disable @next/next/no-img-element */
import { Product } from "@/types/product.types";
import Link from "next/link";
import TakaIcon from "../TakaIcon";

interface EachProductShowProps {
  products: Product[];
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  setProductImage: React.Dispatch<React.SetStateAction<string>>;
  hoveredProduct: number | null;
  setHoveredProduct: React.Dispatch<React.SetStateAction<number | null>>;
  productImage: string;
}

const EachProductShow = ({
  products,
  setSelectedProduct,
  setProductImage,
  hoveredProduct,
  setHoveredProduct,
  productImage,
}: EachProductShowProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12">
      {products?.map((product: Product) => {
        const mainImage = product.images?.sort(
          (a, b) => a.serialNo - b.serialNo,
        )[0];

        const isNew =
          product.isNew ??
          (!!product.createdAt &&
            Date.now() - new Date(product.createdAt).getTime() <=
              60 * 24 * 60 * 60 * 1000);

        return (
          <Link
            href={`/products/${product.slug}`}
            key={product.id}
            className="group cursor-pointer"
            onMouseLeave={() => {
              setProductImage("");
              setHoveredProduct(null);
            }}
            onMouseEnter={() => {
              if (product.images && product.images.length > 1) {
                const sortedImages = product.images.sort(
                  (a, b) => a.serialNo - b.serialNo,
                );
                const secondImage =
                  sortedImages[1]?.image || sortedImages[0]?.image;
                setProductImage(secondImage);
              }
              setHoveredProduct(product.id);
            }}
          >
            <div className="relative aspect-3/4 overflow-hidden bg-gray-50 mb-4">
              {mainImage && (
                <img
                  src={
                    hoveredProduct === product.id && productImage
                      ? productImage
                      : mainImage.image
                  }
                  alt={mainImage.alt || product.title}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {/* Discount Badge */}
              {product.basePrice - product.price >= 1 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                  {product.discountType === "PERCENT"
                    ? `${product.discount}% OFF`
                    : `৳${product.discount} OFF`}
                </div>
              )}

              {/* New Badge — auto-hides after 60 days from createdAt */}
              {isNew && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                  New!
                </div>
              )}

              {/* Quick Shop Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedProduct(product);
                }}
                className="absolute bottom-0 left-0 w-full bg-white/90 py-3 text-[10px] font-bold uppercase tracking-[0.2em] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hover:bg-black hover:text-white"
              >
                Quick View
              </button>
            </div>

            <h3 className="text-xs font-medium leading-relaxed mb-1">
              {product.title}
            </h3>

            <div className="mb-3">
              {product.basePrice - product.price >= 1 ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-600 font-medium">
                    <TakaIcon /> {product.price}
                  </p>
                  <p className="text-[10px] text-gray-400 line-through">
                    <TakaIcon /> {product.basePrice}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-600">
                  <TakaIcon /> {product.basePrice}
                </p>
              )}
            </div>

            {product.showColor &&
              product.colors &&
              product.colors.length > 0 && (
                <div className="flex gap-1 items-center">
                  {product.colors.slice(0, 5)?.map((colorItem) => (
                    <div
                      key={colorItem.id}
                      className="w-3 h-3 rounded-full border border-gray-200"
                      style={{
                        backgroundColor: colorItem.color?.hexCode || "#ccc",
                      }}
                    />
                  ))}
                  <span className="text-[10px] text-gray-400 ml-1">
                    {product.colors.length} color
                    {product.colors.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
          </Link>
        );
      })}
    </div>
  );
};

export default EachProductShow;
