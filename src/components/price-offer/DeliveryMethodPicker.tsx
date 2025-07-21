
import React from 'react';
import { cn } from '@/lib/utils';
import { Truck, MapPin, Package } from 'lucide-react';

type DeliveryMethod = 'self_pickup' | 'courier' | 'post';

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
      description: 'Забрать самостоятельно',
      price: 0,
      color: 'text-green-600'
    },
    {
      value: 'courier' as const,
      label: 'Доставка курьером',
      icon: Truck,
      description: 'Доставка по городу',
      price: Math.floor(productPrice * 0.05), // 5% от цены товара
      color: 'text-blue-600'
    },
    {
      value: 'post' as const,
      label: 'Почтовая доставка',
      icon: Package,
      description: 'Доставка почтой',
      price: Math.floor(productPrice * 0.03), // 3% от цены товара
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Способ получения
      </label>
      
      <div className="space-y-2">
        {deliveryOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;
          
          return (
            <div
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Icon className={cn("w-5 h-5", option.color)} />
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-sm font-semibold">
                    {option.price > 0 ? `+$${option.price}` : 'Бесплатно'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {option.description}
                </p>
              </div>
              
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                isSelected ? "border-primary" : "border-gray-300"
              )}>
                {isSelected && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
