import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface BottomPaginationProps {
  handlePrevPage: () => void;
  handleNextPage: () => void;
  currentPage: number;
  totalPages: number;
}

const BottomPagination = ({
  handlePrevPage,
  handleNextPage,
  currentPage,
  totalPages,
}: BottomPaginationProps) => {
  return (
    <div className="flex justify-center items-center gap-4 mt-12">
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className={`p-2 ${
          currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-black"
        }`}
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className={`p-2 ${
          currentPage === totalPages
            ? "text-gray-300 cursor-not-allowed"
            : "text-black"
        }`}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default BottomPagination;
