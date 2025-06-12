
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Поиск бренда..."
                value={searchBrandTerm}
                onChange={(e) => setSearchBrandTerm(e.target.value)}
                className="mb-1"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <FormControl>
              <Select
                disabled={isLoadingCarData}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Выберите марку" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Поиск модели..."
                value={searchModelTerm}
                onChange={(e) => setSearchModelTerm(e.target.value)}
                className="mb-1"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <FormControl>
              <Select
                disabled={!watchBrandId || isLoadingCarData}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите модель" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
