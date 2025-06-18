
import React, { useState } from 'react';
import { Search, User, Phone, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Поиск продавца..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-9 ${isMobile ? 'text-base' : ''}`}
        />
      </div>

      {/* Sellers list */}
      <div className={`space-y-3 ${!isMobile ? 'max-h-96 overflow-y-auto' : ''}`}>
        {filteredSellers.map((seller) => (
          <Card key={seller.id} className={`cursor-pointer hover:shadow-md transition-shadow ${isMobile ? 'touch-target' : ''}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-medium ${isMobile ? 'text-base' : ''}`}>{seller.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {seller.opt_id}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {seller.telegram && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-700">{seller.telegram}</span>
                  </div>
                )}

                <Button 
                  onClick={() => onSellerSelect(seller.id)}
                  disabled={isLoading}
                  size={isMobile ? "lg" : "default"}
                  className={`w-full ${isMobile ? 'touch-target min-h-[48px]' : ''}`}
                >
                  Выбрать продавца
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSellers.length === 0 && debouncedSearchTerm && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Продавцы не найдены</p>
          <p className="text-sm">Попробуйте другой поисковый запрос</p>
        </div>
      )}
    </div>
  );
};
