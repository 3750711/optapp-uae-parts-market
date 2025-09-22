import React from 'react';
import { SmartInput } from './SmartInput';

interface UnifiedPriceInputsProps {
  // Price data
  price: number;
  deliveryPrice: number;
  placeNumber: number;
  
  // Original values
  originalPrice: number;
  originalDeliveryPrice: number;
  originalPlaceNumber: number;
  
  // Handlers
  onPriceChange: (value: number) => void;
  onDeliveryPriceChange: (value: number) => void;
  onPlaceNumberChange: (value: number) => void;
  
  // AI suggestions
  aiSuggestedDeliveryPrices?: number[];
  aiDeliveryConfidence?: number;
  onApplyAIDelivery?: (price: number) => void;
  
  // State
  disabled?: boolean;
  className?: string;
}

export const UnifiedPriceInputs: React.FC<UnifiedPriceInputsProps> = ({
  price,
  deliveryPrice,
  placeNumber,
  
  originalPrice,
  originalDeliveryPrice,
  originalPlaceNumber,
  
  onPriceChange,
  onDeliveryPriceChange,
  onPlaceNumberChange,
  
  aiSuggestedDeliveryPrices,
  aiDeliveryConfidence,
  onApplyAIDelivery,
  
  disabled = false,
  className = ''
}) => {
  // Get the best AI delivery suggestion (usually the first one with highest confidence)
  const bestDeliverySuggestion = aiSuggestedDeliveryPrices?.[0];
  const hasDeliveryAI = bestDeliverySuggestion !== undefined && bestDeliverySuggestion !== deliveryPrice;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Product Price */}
      <SmartInput
        label="Цена товара"
        value={price}
        originalValue={originalPrice}
        onChange={onPriceChange}
        type="number"
        prefix="$"
        min={0}
        step="1"
        placeholder="0"
        disabled={disabled}
      />
      
      {/* Delivery Price with AI */}
      <SmartInput
        label="Стоимость доставки"
        value={deliveryPrice}
        originalValue={originalDeliveryPrice}
        onChange={onDeliveryPriceChange}
        type="number"
        prefix="$"
        min={0}
        step="1"
        placeholder="0"
        disabled={disabled}
        
        aiSuggestion={bestDeliverySuggestion}
        aiConfidence={aiDeliveryConfidence}
        onApplyAI={onApplyAIDelivery ? () => onApplyAIDelivery(bestDeliverySuggestion!) : undefined}
      />
      
      {/* Place Number */}
      <SmartInput
        label="Количество мест"
        value={placeNumber}
        originalValue={originalPlaceNumber}
        onChange={onPlaceNumberChange}
        type="number"
        suffix=" шт"
        min={1}
        step="1"
        placeholder="1"
        disabled={disabled}
      />
    </div>
  );
};