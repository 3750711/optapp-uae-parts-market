
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingSectionProps {
  price: string;
  deliveryPrice: string;
  onPriceChange: (value: string) => void;
  onDeliveryPriceChange: (value: string) => void;
  disabled?: boolean;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  price,
  deliveryPrice,
  onPriceChange,
  onDeliveryPriceChange,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="price">Цена ($) *</Label>
        <Input 
          id="price" 
          type="number" 
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          required 
          placeholder="0.00"
          step="0.01"
          min="0"
          inputMode="decimal"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="delivery_price">Стоимость доставки ($)</Label>
        <Input 
          id="delivery_price"
          type="number"
          value={deliveryPrice}
          onChange={(e) => onDeliveryPriceChange(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          inputMode="decimal"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
