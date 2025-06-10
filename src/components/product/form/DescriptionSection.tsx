
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ProductFormValues } from '../OptimizedAddProductForm';

interface DescriptionSectionProps {
  form: UseFormReturn<ProductFormValues>;
  isMobile?: boolean;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({ form, isMobile = false }) => {
  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={isMobile ? "text-base font-medium" : ""}>
            Описание
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder="Дополнительная информация о товаре"
              className={isMobile ? "min-h-[120px] text-base" : "min-h-[100px]"}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DescriptionSection;
