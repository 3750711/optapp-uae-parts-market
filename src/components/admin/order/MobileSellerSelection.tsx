
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

  if (!isMobile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Выберите продавца
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск продавца..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {filteredSellers.map((seller) => (
              <Card key={seller.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{seller.full_name}</h3>
                      <p className="text-sm text-gray-600">OPT ID: {seller.opt_id}</p>
                      {seller.telegram && (
                        <div className="flex items-center gap-1 mt-1">
                          <MessageCircle className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600">{seller.telegram}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => onSellerSelect(seller.id)}
                      disabled={isLoading}
                    >
                      Выбрать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Поиск продавца..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-base"
        />
      </div>

      {/* Mobile seller list */}
      <div className="space-y-3">
        {filteredSellers.map((seller) => (
          <Card key={seller.id} className="touch-target">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-base">{seller.full_name}</h3>
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
                  size="lg"
                  className="w-full touch-target min-h-[48px]"
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
