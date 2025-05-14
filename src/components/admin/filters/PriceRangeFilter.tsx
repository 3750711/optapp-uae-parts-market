
import React from 'react';
import { Slider } from "@/components/ui/slider";

interface PriceRangeFilterProps {
  priceRange: [number, number];
  maxPrice: number;
  onChange: (value: [number, number]) => void;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({ 
  priceRange, 
  maxPrice, 
  onChange 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm">Диапазон цен ($)</label>
        <div className="text-xs text-muted-foreground">
          {priceRange[0]} - {priceRange[1]}
        </div>
      </div>
      <Slider
        value={priceRange}
        min={0}
        max={maxPrice}
        step={10}
        onValueChange={(value: [number, number]) => onChange(value)}
        className="py-4"
      />
    </div>
  );
};

export default PriceRangeFilter;
