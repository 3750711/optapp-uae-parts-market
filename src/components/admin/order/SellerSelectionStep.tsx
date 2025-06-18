
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface SellerSelectionStepProps {
  sellers: SellerProfile[];
  onSellerSelect: (sellerId: string) => void;
  isLoading?: boolean;
}

const SellerSelectionStep: React.FC<SellerSelectionStepProps> = ({
  sellers,
  onSellerSelect,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSellers = sellers.filter(seller =>
    seller.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    seller.opt_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаг 1: Выберите продавца</CardTitle>
        <CardDescription>
          Выберите продавца, товар которого хотите продать
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select onValueChange={onSellerSelect}>
          <SelectTrigger className="w-full">
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
                <p className="text-sm">
                  {debouncedSearchTerm ? 'Продавцы не найдены' : 'Нет доступных продавцов'}
                </p>
              </div>
            ) : (
              filteredSellers.map((seller) => (
                <SelectItem key={seller.id} value={seller.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{seller.full_name}</span>
                    <span className="text-xs text-gray-500">OPT: {seller.opt_id}</span>
                    {seller.telegram && (
                      <span className="text-xs text-blue-600">{seller.telegram}</span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default SellerSelectionStep;
