import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Zap, Settings, Wrench, Circle } from 'lucide-react';

interface QuickFiltersProps {
  onFilterSelect: (filter: string) => void;
  activeFilter?: string;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  onFilterSelect,
  activeFilter = ''
}) => {
  const quickFilterCategories = [
    {
      label: 'Кузовные',
      value: 'кузовные',
      icon: Car,
      searches: ['фары', 'бампер', 'крыло', 'дверь', 'капот']
    },
    {
      label: 'Двигатель',
      value: 'двигатель',
      icon: Settings,
      searches: ['двигатель', 'головка', 'блок', 'поршень', 'клапан']
    },
    {
      label: 'Электрика',
      value: 'электрика',
      icon: Zap,
      searches: ['генератор', 'стартер', 'аккумулятор', 'проводка', 'свечи']
    },
    {
      label: 'Ходовая',
      value: 'ходовая',
      icon: Circle,
      searches: ['амортизатор', 'стойка', 'рычаг', 'ступица', 'диск']
    },
    {
      label: 'Трансмиссия',
      value: 'трансмиссия',
      icon: Wrench,
      searches: ['коробка', 'сцепление', 'привод', 'кардан', 'дифференциал']
    }
  ];

  const popularBrands = [
    'Nissan', 'Toyota', 'Mazda', 'Honda', 'Mitsubishi', 'Subaru'
  ];

  const isActiveFilter = (filterValue: string) => {
    return activeFilter.toLowerCase().includes(filterValue.toLowerCase());
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Quick Category Filters */}
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Категории запчастей
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilterCategories.map((category) => {
            const Icon = category.icon;
            const isActive = isActiveFilter(category.value);
            
            return (
              <Button
                key={category.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`h-8 text-xs transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-muted hover:border-primary/50'
                }`}
                onClick={() => onFilterSelect(category.value)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Popular Brands */}
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Популярные марки
        </div>
        <div className="flex flex-wrap gap-2">
          {popularBrands.map((brand) => {
            const isActive = isActiveFilter(brand);
            
            return (
              <Badge
                key={brand}
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted hover:border-primary/50'
                }`}
                onClick={() => onFilterSelect(brand)}
              >
                {brand}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickFilters;