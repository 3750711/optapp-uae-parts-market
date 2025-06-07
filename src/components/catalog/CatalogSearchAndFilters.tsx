
import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchBar from '@/components/admin/filters/SearchBar';
import ActiveSearchDisplay from '@/components/admin/filters/ActiveSearchDisplay';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearch: () => void;
  onClearSearch: () => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedBrand: string | null;
  selectBrand: (brand: string | null) => void;
  selectedModel: string | null;
  setSelectedModel: (model: string | null) => void;
  brands: { id: string; name: string }[];
  brandModels: { id: string; name: string }[];
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearch,
  onClearSearch,
  onSearchSubmit,
  selectedBrand,
  selectBrand,
  selectedModel,
  setSelectedModel,
  brands,
  brandModels
}) => {
  return (
    <Card className="mb-4">
      <div className="p-4 space-y-4">
        {/* Поисковая строка */}
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={onSearch}
          onClear={onClearSearch}
          activeSearchTerm={activeSearchTerm}
          placeholder="Поиск по названию, бренду, модели..."
        />
        
        {/* Активный поиск */}
        <ActiveSearchDisplay 
          searchTerm={activeSearchTerm} 
          onClear={onClearSearch} 
        />

        {/* Фильтры марки и модели с ссылкой на руководство */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Brand select */}
          <Select
            value={selectedBrand || ""}
            onValueChange={(value) => selectBrand(value === "all-brands" ? null : value)}
          >
            <SelectTrigger className="flex-1 bg-white">
              <SelectValue placeholder="Выберите марку" />
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
            <SelectTrigger className="flex-1 bg-white">
              <SelectValue placeholder="Выберите модель" />
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
          <Button type="submit" onClick={onSearchSubmit} className="bg-primary hover:bg-primary/90">
            <Search className="h-4 w-4 mr-2" />
            Поиск
          </Button>
        </div>

        {/* Ссылка на руководство покупателя */}
        <div className="flex justify-center pt-2">
          <Link 
            to="/buyer-guide" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Как покупать товар?
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default CatalogSearchAndFilters;
