
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ProductFormValues } from '../OptimizedAddProductForm';

interface PriceSectionProps {
  form: UseFormReturn<ProductFormValues>;
  isMobile?: boolean;
}

const PriceSection: React.FC<PriceSectionProps> = ({ form, isMobile = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Цена *
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="Введите цену"
                className={isMobile ? "h-12 text-base" : ""}
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="delivery_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Стоимость доставки
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                className={isMobile ? "h-12 text-base" : ""}
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="place_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Количество мест
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="10"
                placeholder="1"
                className={isMobile ? "h-12 text-base" : ""}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PriceSection;
