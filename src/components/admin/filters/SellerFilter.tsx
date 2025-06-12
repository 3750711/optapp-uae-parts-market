
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SellerFilterProps {
  value: string;
  onChange: (value: string) => void;
  sellers: Array<{ id: string; name: string; }>;
  disabled?: boolean;
}

const SellerFilter: React.FC<SellerFilterProps> = ({ 
  value, 
  onChange, 
  sellers,
  disabled = false 
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm">Продавец</label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Все продавцы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все продавцы</SelectItem>
          {sellers.map((seller) => (
            <SelectItem key={seller.id} value={seller.id}>
              {seller.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SellerFilter;
