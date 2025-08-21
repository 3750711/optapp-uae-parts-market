
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface SellerFilterProps {
  value: string;
  onChange: (value: string) => void;
  sellers: Array<{ id: string; name: string; opt_id?: string; }>;
  disabled?: boolean;
}

const SellerFilter: React.FC<SellerFilterProps> = ({ value, onChange, sellers, disabled }) => {
  return (
    <div className="space-y-2">
        <Label htmlFor="seller-filter">Продавец</Label>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="seller-filter">
            <SelectValue placeholder="Выберите продавца" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">Все продавцы</SelectItem>
            {sellers
              .sort((a, b) => (a.opt_id || '').localeCompare(b.opt_id || ''))
              .map(seller => (
                <SelectItem key={seller.id} value={seller.id}>
                  {seller.opt_id ? `${seller.opt_id} - ${seller.name}` : seller.name}
                </SelectItem>
              ))}
        </SelectContent>
        </Select>
    </div>
  );
};

export default SellerFilter;
