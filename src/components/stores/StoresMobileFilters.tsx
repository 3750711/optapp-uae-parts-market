
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Star, MapPin, Package, ShieldCheck } from 'lucide-react';
import { StoresFilters } from '@/hooks/useOptimizedStores';

interface StoresMobileFiltersProps {
  filters: StoresFilters;
  onFiltersChange: (filters: StoresFilters) => void;
  onClearFilters: () => void;
  availableTags?: string[];
  availableLocations?: string[];
  hasActiveFilters: boolean;
}

const StoresMobileFilters: React.FC<StoresMobileFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableTags = [],
  availableLocations = [],
  hasActiveFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleVerifiedChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      verified: checked ? true : undefined
    });
  };

  const handleRatingChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minRating: value[0] > 0 ? value[0] : undefined
    });
  };

  const handleProductCountChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minProductCount: value[0] > 0 ? value[0] : undefined
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    onFiltersChange({
      ...filters,
      tags: updatedTags.length > 0 ? updatedTags : undefined
    });
  };

  const handleLocationChange = (location: string) => {
    onFiltersChange({
      ...filters,
      location: location === 'all' ? undefined : location
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={`relative ${hasActiveFilters ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Фильтры магазинов
          </SheetTitle>
          <SheetDescription>
            Настройте фильтры для поиска подходящих магазинов
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 pb-20">
          {/* Quick filters */}
          <div className="space-y-4">
            <h3 className="font-medium">Быстрые фильтры</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified-mobile"
                checked={filters.verified || false}
                onCheckedChange={handleVerifiedChange}
              />
              <label htmlFor="verified-mobile" className="flex items-center gap-1 text-sm font-medium cursor-pointer">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Только проверенные
              </label>
            </div>
          </div>

          {/* Location filter */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Местоположение
            </label>
            <Select value={filters.location || 'all'} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите город" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все города</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating filter */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Star className="h-4 w-4" />
              Минимальный рейтинг: {filters.minRating || 0}
            </label>
            <Slider
              value={[filters.minRating || 0]}
              onValueChange={handleRatingChange}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>5</span>
            </div>
          </div>

          {/* Product count filter */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4" />
              Минимум товаров: {filters.minProductCount || 0}
            </label>
            <Slider
              value={[filters.minProductCount || 0]}
              onValueChange={handleProductCountChange}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>100+</span>
            </div>
          </div>

          {/* Tags filter */}
          {availableTags.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Специализация</label>
              <div className="grid grid-cols-2 gap-2">
                {availableTags.map((tag) => {
                  const isSelected = filters.tags?.includes(tag) || false;
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 text-center py-2 ${
                        isSelected 
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'hover:bg-primary/10 hover:border-primary'
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag.replace('_', ' ')}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Активные фильтры:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Очистить все
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.verified && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Проверенные
                  </Badge>
                )}
                {filters.minRating && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Рейтинг ≥ {filters.minRating}
                  </Badge>
                )}
                {filters.minProductCount && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Товаров ≥ {filters.minProductCount}
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {filters.location}
                  </Badge>
                )}
                {filters.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed bottom actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="flex-1"
              disabled={!hasActiveFilters}
            >
              Сбросить
            </Button>
            <Button 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Применить
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoresMobileFilters;
