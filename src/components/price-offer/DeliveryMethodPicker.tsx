
import React from 'react';
import { cn } from '@/lib/utils';
import { Truck, MapPin, Package } from 'lucide-react';

type DeliveryMethod = 'self_pickup' | 'cargo_rf' | 'cargo_kz';

interface DeliveryMethodPickerProps {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
  productPrice: number;
}

export const DeliveryMethodPicker: React.FC<DeliveryMethodPickerProps> = ({
  value,
  onChange,
  productPrice
}) => {
  const deliveryOptions = [
    {
      value: 'self_pickup' as const,
      label: 'Самовывоз',
      icon: MapPin,
      color: 'text-green-600'
    },
    {
      value: 'cargo_rf' as const,
      label: 'Карго РФ',
      icon: Truck,
      color: 'text-blue-600'
    },
    {
      value: 'cargo_kz' as const,
      label: 'Карго КЗ',
      icon: Package,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Способ доставки
      </label>
      
      <div className="flex gap-2">
        {deliveryOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors",
                isSelected 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
