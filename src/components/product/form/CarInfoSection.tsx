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
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface CarInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
  brands: Brand[];
  models: Model[];
  watchBrandId: string;
  isLoadingCarData: boolean;
}

const CarInfoSection = React.memo<CarInfoSectionProps>(({ 
  form,
  brands,
  models,
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
                options={brands}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Выберите марку"
                searchPlaceholder="Поиск марки..."
                disabled={isLoadingCarData}
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
                options={models}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={watchBrandId ? "Выберите модель" : "Сначала выберите марку"}
                searchPlaceholder="Поиск модели..."
                disabled={!watchBrandId || isLoadingCarData}
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
