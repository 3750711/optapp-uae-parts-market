
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';

interface Seller {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface MobileSellerSelectionProps {
  sellers: Seller[];
  onSellerSelect: (sellerId: string) => void;
  isLoading?: boolean;
}

export const MobileSellerSelection: React.FC<MobileSellerSelectionProps> = ({
  sellers,
  onSellerSelect,
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSellers = sellers.filter(seller =>
    seller.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    seller.opt_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {!isMobile && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
          </Card>
        )}
        <Skeleton className={`h-12 w-full ${isMobile ? 'h-14' : ''}`} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isMobile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Выберите продавца
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <Select onValueChange={onSellerSelect}>
        <SelectTrigger className={`w-full ${isMobile ? 'h-14 text-base touch-target' : 'h-10'}`}>
          <SelectValue placeholder="Выберите продавца..." />
        </SelectTrigger>
        <SelectContent 
          showSearch={true}
          searchPlaceholder="Поиск продавца..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        >
          {filteredSellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <User className="h-12 w-12 mb-2 text-gray-300" />
              <p className={`${isMobile ? 'text-base' : 'text-sm'}`}>
                {debouncedSearchTerm ? 'Продавцы не найдены' : 'Нет доступных продавцов'}
              </p>
              {debouncedSearchTerm && (
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-center mt-1`}>
                  Попробуйте другой поисковый запрос
                </p>
              )}
            </div>
          ) : (
            filteredSellers.map((seller) => (
              <SelectItem 
                key={seller.id} 
                value={seller.id}
                className={isMobile ? 'py-3 min-h-[48px]' : ''}
              >
                <div className="flex flex-col w-full">
                  <span className={`font-medium ${isMobile ? 'text-base' : ''}`}>
                    {seller.full_name}
                  </span>
                  <span className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                    OPT: {seller.opt_id}
                  </span>
                  {seller.telegram && (
                    <span className={`text-blue-600 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      {seller.telegram}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
