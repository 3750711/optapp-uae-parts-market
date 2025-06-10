
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

interface BasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const BasicInfoSection = React.memo<BasicInfoSectionProps>(({ form }) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Название товара</FormLabel>
            <FormControl>
              <Input 
                placeholder="Например: Передний бампер BMW X5 F15"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цена ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  {...field}
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
              <FormLabel>Стоимость доставки ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
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
        name="place_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Количество мест для отправки</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="1"
                placeholder="Количество мест"
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
            <FormLabel>Описание товара (необязательно)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Описание товара"
                className="min-h-[100px]"
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

BasicInfoSection.displayName = "BasicInfoSection";

export default BasicInfoSection;
