
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface StoresPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const StoresPagination: React.FC<StoresPaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
  hasNextPage,
  hasPreviousPage
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Generate page numbers to show
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, 'dots');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('dots', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Page info */}
      <div className="text-sm text-gray-600">
        Показано {startItem}-{endItem} из {totalCount} магазинов
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>

        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === 'dots' ? (
              <Button variant="ghost" size="sm" disabled>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="ml-2"
        >
          Вперед
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default StoresPagination;
