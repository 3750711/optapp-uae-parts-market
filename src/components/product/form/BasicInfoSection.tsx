
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
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from '@/hooks/useLanguage';
import { getFormTranslations } from '@/utils/translations/forms';

interface BasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const BasicInfoSection = React.memo<BasicInfoSectionProps>(({ form }) => {
  const { language } = useLanguage();
  const t = getFormTranslations(language);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.labels.title}</FormLabel>
            <FormControl>
              <Input 
                placeholder={t.placeholders.titleExample}
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
              <FormLabel>{t.labels.price}</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="1"
                  inputMode="numeric"
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
              <FormLabel>{t.labels.deliveryPrice}</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="1"
                  inputMode="numeric"
                  placeholder={t.placeholders.deliveryPrice}
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
            <FormLabel>{t.labels.placeNumber}</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="1"
                placeholder={t.placeholders.placeNumberText}
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
            <FormLabel>{t.labels.description} {t.optional}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={t.placeholders.description}
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
