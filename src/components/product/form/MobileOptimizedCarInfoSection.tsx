
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../OptimizedAddProductForm';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import EnhancedVirtualizedSelect from "@/components/ui/EnhancedVirtualizedSelect";
import { useIsMobile } from "@/hooks/use-mobile";

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface MobileOptimizedCarInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
  filteredBrands: Brand[];
  filteredModels: Model[];
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  watchBrandId: string;
  isLoadingCarData: boolean;
}

// Популярные бренды (можно вынести в конфиг)
const POPULAR_BRANDS = [
  "toyota", "honda", "ford", "chevrolet", "nissan", 
  "hyundai", "kia", "volkswagen", "bmw", "mercedes-benz"
];

const MobileOptimizedCarInfoSection = React.memo<MobileOptimizedCarInfoSectionProps>(({ 
  form,
  filteredBrands,
  filteredModels,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  watchBrandId,
  isLoadingCarData
}) => {
  const isMobile = useIsMobile();

  // Определяем популярные бренды из доступных
  const popularBrandIds = filteredBrands
    .filter(brand => POPULAR_BRANDS.includes(brand.name.toLowerCase()))
    .map(brand => brand.id);

  return (
    <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "md:grid-cols-2 gap-4"}`}>
      <FormField
        control={form.control}
        name="brandId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Марка автомобиля
            </FormLabel>
            <FormControl>
              <EnhancedVirtualizedSelect
                options={filteredBrands}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Выберите марку"
                searchPlaceholder="Поиск бренда..."
                disabled={isLoadingCarData}
                className={isMobile ? "h-12" : ""}
                popularOptions={popularBrandIds}
                searchTerm={searchBrandTerm}
                onSearchChange={setSearchBrandTerm}
                showResultCount={true}
                isLoading={isLoadingCarData}
                isEmpty={searchBrandTerm !== '' && filteredBrands.length === 0}
                emptyMessage="Бренд не найден"
                loadingMessage="Загрузка брендов..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="modelId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Модель (необязательно)
            </FormLabel>
            <FormControl>
              <EnhancedVirtualizedSelect
                options={filteredModels}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Выберите модель"
                searchPlaceholder="Поиск модели..."
                disabled={!watchBrandId || isLoadingCarData}
                className={isMobile ? "h-12" : ""}
                searchTerm={searchModelTerm}
                onSearchChange={setSearchModelTerm}
                showResultCount={true}
                isLoading={isLoadingCarData && !!watchBrandId}
                isEmpty={searchModelTerm !== '' && filteredModels.length === 0 && !!watchBrandId}
                emptyMessage={!watchBrandId ? "Сначала выберите марку" : "Модель не найдена"}
                loadingMessage="Загрузка моделей..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

MobileOptimizedCarInfoSection.displayName = "MobileOptimizedCarInfoSection";

export default MobileOptimizedCarInfoSection;
