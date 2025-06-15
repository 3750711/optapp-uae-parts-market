
import React, { useState, useMemo } from 'react';
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
  const [brandSearchTerm, setBrandSearchTerm] = useState("");
  const [modelSearchTerm, setModelSearchTerm] = useState("");

  const filteredBrands = useMemo(() => {
    if (!brandSearchTerm) return brands;
    return brands.filter(b => b.name.toLowerCase().includes(brandSearchTerm.toLowerCase()));
  }, [brands, brandSearchTerm]);

  const filteredModels = useMemo(() => {
    if (!modelSearchTerm) return models;
    return models.filter(m => m.name.toLowerCase().includes(modelSearchTerm.toLowerCase()));
  }, [models, modelSearchTerm]);
  
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
                searchPlaceholder="Поиск марки..."
                disabled={isLoadingCarData}
                searchTerm={brandSearchTerm}
                onSearchChange={setBrandSearchTerm}
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
                searchTerm={modelSearchTerm}
                onSearchChange={setModelSearchTerm}
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
