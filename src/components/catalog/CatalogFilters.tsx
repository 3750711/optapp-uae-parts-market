
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";

export interface FilterState {
  brands: string[];
  models: string[];
  priceRange: { min: number; max: number };
  condition: string[];
}

interface CatalogFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  selectedBrandName: string | null;
  setSelectedBrandName: (brandName: string | null) => void;
  selectedModelName: string | null;
  setSelectedModelName: (modelName: string | null) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  handleClearSearch: () => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  isActiveFilters: boolean;
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  hideSoldProducts,
  setHideSoldProducts,
  handleClearSearch,
  handleSearchSubmit,
  isActiveFilters
}) => {
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Поиск</Button>
        {isActiveFilters && (
          <Button variant="outline" onClick={handleClearSearch}>
            <X className="h-4 w-4 mr-2" />
            Сбросить
          </Button>
        )}
      </form>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="hide-sold"
          checked={hideSoldProducts}
          onCheckedChange={setHideSoldProducts}
        />
        <Label htmlFor="hide-sold">Скрыть проданные товары</Label>
      </div>
    </div>
  );
};

export default CatalogFilters;
