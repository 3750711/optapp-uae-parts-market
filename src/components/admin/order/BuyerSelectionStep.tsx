
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, ArrowLeft, MessageCircle } from 'lucide-react';
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
}

const BuyerSelectionStep: React.FC<BuyerSelectionStepProps> = ({
  selectedProduct,
  buyers,
  onBuyerSelect,
  onBackToProducts
}) => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredBuyers = buyers.filter(buyer =>
    buyer.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    buyer.opt_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск покупателя..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-base"
          />
        </div>

        {/* Buyers list */}
        <div className="space-y-3">
          {filteredBuyers.map((buyer) => (
            <Card key={buyer.id} className="touch-target">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-base">{buyer.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          OPT: {buyer.opt_id}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {buyer.telegram && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">{buyer.telegram}</span>
                    </div>
                  )}

                  <Button 
                    onClick={() => onBuyerSelect(buyer.id)}
                    size="lg"
                    className="w-full touch-target min-h-[48px]"
                  >
                    Выбрать покупателя
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBuyers.length === 0 && debouncedSearchTerm && (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Покупатели не найдены</p>
            <p className="text-sm">Попробуйте другой поисковый запрос</p>
          </div>
        )}
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
                <Badge variant="success" className="text-xs">
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
                <SelectValue placeholder="Выберите покупателя" />
              </SelectTrigger>
              <SelectContent>
                {buyers.map((buyer) => (
                  <SelectItem key={buyer.id} value={buyer.id}>
                    {buyer.full_name} ({buyer.opt_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-6 flex space-x-2">
            <Button variant="outline" onClick={onBackToProducts}>
              Назад
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerSelectionStep;
