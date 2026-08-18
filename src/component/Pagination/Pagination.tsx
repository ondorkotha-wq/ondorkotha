import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChevronPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ChevronPagination: React.FC<ChevronPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center gap-4 justify-center mt-6 font-bold">
      <ChevronLeft
        size={18}
        className={`${
          currentPage === 1
            ? "text-gray-300 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        onClick={handlePrev}
      />

      <span className="text-xs">
        {currentPage} / {totalPages}
      </span>

      <ChevronRight
        size={18}
        className={`${
          currentPage === totalPages
            ? "text-gray-300 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        onClick={handleNext}
      />
    </div>
  );
};

export default ChevronPagination;
