
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface SellerSelectionStepProps {
  sellers: SellerProfile[];
  onSellerSelect: (sellerId: string) => void;
}

const SellerSelectionStep: React.FC<SellerSelectionStepProps> = ({
  sellers,
  onSellerSelect
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Шаг 1: Выберите продавца</CardTitle>
        <CardDescription>
          Выберите продавца, товар которого хотите продать
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label htmlFor="seller">Продавец</Label>
          <Select onValueChange={onSellerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите продавца" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((seller) => (
                <SelectItem key={seller.id} value={seller.id}>
                  {seller.full_name} ({seller.opt_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerSelectionStep;
