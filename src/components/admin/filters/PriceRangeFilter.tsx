
import React from 'react';
import { Slider } from "@/components/ui/slider";

interface PriceRangeFilterProps {
  value: { min: number; max: number };
  onChange: (range: { min: number; max: number }) => void;
  disabled?: boolean;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({ 
  value, 
  onChange,
  disabled = false
}) => {
  const maxPrice = 100000; // Default max price
  
  const handleSliderChange = (sliderValue: number[]) => {
    onChange({
      min: sliderValue[0],
      max: sliderValue[1]
    });
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
