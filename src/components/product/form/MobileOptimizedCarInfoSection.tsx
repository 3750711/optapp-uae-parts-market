
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
import VirtualizedSelect from "@/components/ui/VirtualizedSelect";
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
              <VirtualizedSelect
                options={filteredBrands}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Выберите марку"
                searchPlaceholder="Поиск бренда..."
                disabled={isLoadingCarData}
                className={isMobile ? "h-12" : ""}
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
              <VirtualizedSelect
                options={filteredModels}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Выберите модель"
                searchPlaceholder="Поиск модели..."
                disabled={!watchBrandId || isLoadingCarData}
                className={isMobile ? "h-12" : ""}
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
