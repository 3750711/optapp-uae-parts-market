import React, { memo } from 'react';
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

interface FastBasicInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const FastBasicInfoSection = memo<FastBasicInfoSectionProps>(({ form }) => {
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  
  return (
    <div className="fast-basic-info">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="mobile-form-item">
            <FormLabel className="mobile-form-label">{t.labels.title}</FormLabel>
            <FormControl>
              <Input 
                placeholder={t.placeholders.titleExample}
                className="mobile-input"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="mobile-grid-2">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem className="mobile-form-item">
              <FormLabel className="mobile-form-label">{t.labels.price}</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="1"
                  inputMode="numeric"
                  className="mobile-input"
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
            <FormItem className="mobile-form-item">
              <FormLabel className="mobile-form-label">{t.labels.deliveryPrice}</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="1"
                  inputMode="numeric"
                  placeholder={t.placeholders.deliveryPrice}
                  className="mobile-input"
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
          <FormItem className="mobile-form-item">
            <FormLabel className="mobile-form-label">{t.labels.placeNumber}</FormLabel>
            <FormControl>
              <Input 
                type="number"
                min="1"
                placeholder={t.placeholders.placeNumberText}
                className="mobile-input"
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
          <FormItem className="mobile-form-item">
            <FormLabel className="mobile-form-label">{t.labels.description} {t.optional}</FormLabel>
            <FormControl>
              <Textarea 
                placeholder={t.placeholders.description}
                className="mobile-textarea"
                rows={4}
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

FastBasicInfoSection.displayName = "FastBasicInfoSection";

export default FastBasicInfoSection;