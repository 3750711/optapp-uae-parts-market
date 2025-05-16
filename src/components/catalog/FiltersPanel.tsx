
import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface FiltersPanelProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedBrand: string | null;
  selectBrand: (brand: string | null) => void;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  brands: { id: string; name: string }[];
  brandModels: { id: string; name: string }[];
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleClearSearch: () => void;
  isActiveFilters: boolean;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showFilters,
  setShowFilters,
  selectedBrand,
  selectBrand,
  selectedModel,
  setSelectedModel,
  brands,
  brandModels,
  hideSoldProducts,
  setHideSoldProducts,
  handleSearchSubmit,
  handleClearSearch,
  isActiveFilters
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Mobile filters toggle */}
        <div className="block sm:hidden">
          <Button 
            type="button" 
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Фильтры
          </Button>
        </div>
        
        {/* Desktop filters always visible */}
        <div className="hidden sm:flex gap-3">
          {/* Brand select */}
          <Select
            value={selectedBrand || ""}
            onValueChange={(value) => selectBrand(value === "all-brands" ? null : value)}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Марка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-brands">Все марки</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Model select */}
          <Select
            value={selectedModel || ""}
            onValueChange={(value) => setSelectedModel(value === "all-models" ? null : value)}
            disabled={!selectedBrand}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Модель" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-models">Все модели</SelectItem>
              {brandModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        
          {/* Search button */}
          <Button type="submit" onClick={handleSearchSubmit} className="bg-primary hover:bg-primary/90">
            <Search className="h-4 w-4 mr-2" />
            Поиск
          </Button>
        </div>
      </div>
      
      {/* Mobile filters (collapsible) */}
      {showFilters && isMobile && (
        <div className="sm:hidden flex flex-col gap-3 p-3 bg-white rounded-lg shadow-sm border animate-fade-in">
          {/* Brand select */}
          <Select
            value={selectedBrand || ""}
            onValueChange={(value) => selectBrand(value === "all-brands" ? null : value)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Марка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-brands">Все марки</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Model select */}
          <Select
            value={selectedModel || ""}
            onValueChange={(value) => setSelectedModel(value === "all-models" ? null : value)}
            disabled={!selectedBrand}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Модель" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-models">Все модели</SelectItem>
              {brandModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Search button */}
          <Button type="submit" onClick={handleSearchSubmit} className="w-full bg-primary hover:bg-primary/90">
            <Search className="h-4 w-4 mr-2" />
            Поиск
          </Button>
        </div>
      )}

      {/* Hide sold products checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="hide-sold" 
          checked={hideSoldProducts}
          onCheckedChange={(checked) => setHideSoldProducts(checked === true)}
        />
        <Label htmlFor="hide-sold" className="text-sm cursor-pointer">
          Не показывать проданные
        </Label>
      </div>

      {/* Active filters display */}
      {isActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={handleClearSearch}
            className="text-blue-600 underline hover:text-blue-800 text-sm"
          >
            Сбросить все
          </button>
        </div>
      )}
    </>
  );
};

export default FiltersPanel;
