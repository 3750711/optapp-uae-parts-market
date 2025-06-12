
import React from 'react';
import { Slider } from "@/components/ui/slider";

export interface PriceRange {
  min: number;
  max: number;
}

interface PriceRangeFilterProps {
  value: PriceRange;
  maxPrice?: number;
  onChange: (value: PriceRange) => void;
  disabled?: boolean;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({ 
  value, 
  maxPrice = 100000, 
  onChange,
  disabled = false 
}) => {
  const handleSliderChange = (values: number[]) => {
    onChange({ min: values[0], max: values[1] });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm">Диапазон цен ($)</label>
        <div className="text-xs text-muted-foreground">
          {value.min} - {value.max}
        </div>
      </div>
      <Slider
        value={[value.min, value.max]}
        min={0}
        max={maxPrice}
        step={10}
        onValueChange={handleSliderChange}
        disabled={disabled}
        className="py-4"
      />
    </div>
  );
};

export default PriceRangeFilter;
