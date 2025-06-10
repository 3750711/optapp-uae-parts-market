
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаг 3: Выберите покупателя</CardTitle>
        <CardDescription>
          Товар: {selectedProduct.title}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Лот: {selectedProduct.lot_number}
            </Badge>
            <Badge variant="success" className="text-xs">
              {selectedProduct.status}
            </Badge>
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
  );
};

export default BuyerSelectionStep;
