
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileOptimizedBasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const MobileOptimizedBasicInfoSection = React.memo<MobileOptimizedBasicInfoSectionProps>(({ form }) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Название товара
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Например: Передний бампер BMW X5 F15"
                className={isMobile ? "h-12 text-base" : ""}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "md:grid-cols-2 gap-4"}`}>
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isMobile ? "text-base font-medium" : ""}>
                Цена ($)
              </FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className={isMobile ? "h-12 text-base" : ""}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isMobile ? "text-base font-medium" : ""}>
                Стоимость доставки ($)
              </FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={isMobile ? "h-12 text-base" : ""}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="placeNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Количество мест для отправки
            </FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="1"
                placeholder="Количество мест"
                className={isMobile ? "h-12 text-base" : ""}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={isMobile ? "text-base font-medium" : ""}>
              Описание товара (необязательно)
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Описание товара"
                className={`min-h-[100px] ${isMobile ? "text-base" : ""}`}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});

MobileOptimizedBasicInfoSection.displayName = "MobileOptimizedBasicInfoSection";

export default MobileOptimizedBasicInfoSection;
