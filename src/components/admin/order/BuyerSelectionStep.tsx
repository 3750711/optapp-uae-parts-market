
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  lot_number?: number;
  status?: string;
}

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface BuyerSelectionStepProps {
  selectedProduct: Product;
  buyers: BuyerProfile[];
  onBuyerSelect: (buyerId: string) => void;
  onBackToProducts: () => void;
  isLoading?: boolean;
}

const BuyerSelectionStep: React.FC<BuyerSelectionStepProps> = ({
  selectedProduct,
  buyers,
  onBuyerSelect,
  onBackToProducts,
  isLoading = false
}) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredBuyers = buyers.filter(buyer =>
    buyer.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    buyer.opt_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24 mt-1" />
          </CardContent>
        </Card>
        <Skeleton className={`w-full ${isMobile ? 'h-14' : 'h-10'}`} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Selected product summary */}
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Выбранный товар</Badge>
            </div>
            <h3 className="font-medium text-sm">{selectedProduct.title}</h3>
            <p className="text-sm text-gray-600">{selectedProduct.price} AED</p>
          </CardContent>
        </Card>

        {/* Buyer selection */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Выберите покупателя</Label>
          <Select onValueChange={onBuyerSelect}>
            <SelectTrigger className="w-full h-14 text-base touch-target">
              <SelectValue placeholder="Выберите покупателя..." />
            </SelectTrigger>
            <SelectContent 
              showSearch={true}
              searchPlaceholder="Поиск покупателя..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
            >
              {filteredBuyers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <User className="h-12 w-12 mb-2 text-gray-300" />
                  <p className="text-base">
                    {debouncedSearchTerm ? 'Покупатели не найдены' : 'Нет доступных покупателей'}
                  </p>
                  {debouncedSearchTerm && (
                    <p className="text-sm text-center mt-1">
                      Попробуйте другой поисковый запрос
                    </p>
                  )}
                </div>
              ) : (
                filteredBuyers.map((buyer) => (
                  <SelectItem 
                    key={buyer.id} 
                    value={buyer.id}
                    className="py-3 min-h-[48px]"
                  >
                    <div className="flex flex-col w-full">
                      <span className="font-medium text-base">
                        {buyer.full_name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        OPT: {buyer.opt_id}
                      </span>
                      {buyer.telegram && (
                        <span className="text-blue-600 text-sm">
                          {buyer.telegram}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Шаг 3: Выберите покупателя</CardTitle>
          <CardDescription>
            Товар: {selectedProduct.title}
            <div className="flex items-center gap-2 mt-2">
              {selectedProduct.lot_number && (
                <Badge variant="outline" className="text-xs">
                  Лот: {selectedProduct.lot_number}
                </Badge>
              )}
              {selectedProduct.status && (
                <Badge variant="secondary" className="text-xs">
                  {selectedProduct.status}
                </Badge>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="buyer">Покупатель</Label>
            <Select onValueChange={onBuyerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите покупателя..." />
              </SelectTrigger>
              <SelectContent
                showSearch={true}
                searchPlaceholder="Поиск покупателя..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
              >
                {filteredBuyers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <User className="h-12 w-12 mb-2 text-gray-300" />
                    <p className="text-sm">
                      {debouncedSearchTerm ? 'Покупатели не найдены' : 'Нет доступных покупателей'}
                    </p>
                  </div>
                ) : (
                  filteredBuyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{buyer.full_name}</span>
                        <span className="text-xs text-gray-500">OPT: {buyer.opt_id}</span>
                        {buyer.telegram && (
                          <span className="text-xs text-blue-600">{buyer.telegram}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-6 flex space-x-2">
            <Button variant="outline" onClick={onBackToProducts}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerSelectionStep;
