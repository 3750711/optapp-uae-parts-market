
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface OrdersPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
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
    <div className="flex flex-col items-center gap-6 mt-8">
      <div className="text-sm text-gray-600 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
        Показано <span className="font-medium text-primary">{startItem}-{endItem}</span> из{' '}
        <span className="font-medium text-primary">{totalCount}</span> заказов
      </div>

      <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm p-2 rounded-xl shadow-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="mr-2 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary hover:text-white border-primary/20"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>

        {getVisiblePages().map((page, index) => (
          <div key={index}>
            {page === 'dots' ? (
              <Button variant="ghost" size="sm" disabled className="cursor-default">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </Button>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={`min-w-[40px] transition-all duration-300 hover:scale-110 ${
                  currentPage === page 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'hover:bg-primary hover:text-white border-primary/20 hover:shadow-lg'
                }`}
              >
                {page}
              </Button>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="ml-2 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary hover:text-white border-primary/20"
        >
          Вперед
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
