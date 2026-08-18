import ChevronPagination from "@/component/Pagination/Pagination";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface DisplayHeadingProps {
  name: string | undefined;
  isLoading: boolean;
  totalProducts: number;
  isSortOpen: boolean;
  setIsSortOpen: Dispatch<SetStateAction<boolean>>;
  selectedSort: string;
  handleSortChange: (sortName: string) => void;
  setSelectedSort: Dispatch<SetStateAction<string>>;
  sortData: {
    sortCategories: { name: string }[];
  };
  handleNextPage: () => void;
  handlePrevPage: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

const DisplayHeading = ({
  name,
  isLoading,
  totalProducts,
  isSortOpen,
  setIsSortOpen,
  selectedSort,
  handleSortChange,
  setSelectedSort,
  sortData,
  handleNextPage,
  handlePrevPage,
  currentPage,
  setCurrentPage,
  totalPages,
}: DisplayHeadingProps) => {
  return (
    <div className="flex justify-between items-baseline mb-6">
      <h1 className="text-3xl md:text-4xl font-light tracking-tight">
        <span className="heading capitalize">{name} </span>
        <span className="text-xs bottom-0 ml-2 text-gray-400">
          {isLoading ? "..." : `${totalProducts} products`}
        </span>
      </h1>

      {/* Desktop Sort - Hidden on Mobile */}
      <div className="hidden md:flex items-center gap-4 relative">
        <span className="text-xs uppercase tracking-widest text-gray-500">
          Sort:
        </span>

        {/* Sort Trigger */}
        <div
          onClick={() => setIsSortOpen((prev) => !prev)}
          className="border-b border-black flex items-center gap-8 pb-1 cursor-pointer select-none"
        >
          <span className="text-sm">{selectedSort}</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${isSortOpen ? "rotate-180" : ""}`}
          />
        </div>

        {/* Dropdown */}
        {isSortOpen && (
          <div className="absolute top-full left-12 mt-2 w-56 bg-white border shadow-lg z-40">
            {sortData.sortCategories?.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedSort(item.name);
                  setIsSortOpen(false);
                  handleSortChange(item.name);
                }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 ${
                  selectedSort === item.name ? "font-medium bg-gray-50" : ""
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center gap-4 ml-6">
          <ChevronLeft
            size={18}
            className={`${
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            onClick={handlePrevPage}
          />
          <span className="text-xs font-medium">
            {currentPage} / {totalPages}
          </span>
          <ChevronRight
            size={18}
            className={`${
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            onClick={handleNextPage}
          />
        </div>

        
      </div>
    </div>
  );
};

export default DisplayHeading;
