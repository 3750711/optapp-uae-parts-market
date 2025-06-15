import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../AddProductForm';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import EnhancedVirtualizedSelect from '@/components/ui/EnhancedVirtualizedSelect';

interface Brand {
  id: string;
  name: string;
  extraInfo?: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface CarInfoSectionProps {
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

const CarInfoSection = React.memo<CarInfoSectionProps>(({ 
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="brandId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Марка автомобиля</FormLabel>
            <FormControl>
              <EnhancedVirtualizedSelect
                options={filteredBrands}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Выберите марку"
                searchPlaceholder="Поиск бренда..."
                disabled={isLoadingCarData}
                searchTerm={searchBrandTerm}
                onSearchChange={setSearchBrandTerm}
                showResultCount={true}
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
            <FormLabel>Модель (необязательно)</FormLabel>
            <FormControl>
              <EnhancedVirtualizedSelect
                options={filteredModels}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={watchBrandId ? "Выберите модель" : "Сначала выберите марку"}
                searchPlaceholder="Поиск модели..."
                disabled={!watchBrandId || isLoadingCarData}
                searchTerm={searchModelTerm}
                onSearchChange={setSearchModelTerm}
                showResultCount={true}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

CarInfoSection.displayName = "CarInfoSection";

export default CarInfoSection;
