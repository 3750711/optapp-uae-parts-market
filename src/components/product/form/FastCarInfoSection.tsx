import React, { memo, useMemo } from 'react';
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
import { useLanguage } from '@/hooks/useLanguage';
import { getFormTranslations } from '@/utils/translations/forms';

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface FastCarInfoSectionProps {
  form: UseFormReturn<ProductFormValues>;
  brands: Brand[];
  models: Model[];
  watchBrandId: string;
  isLoadingCarData: boolean;
}

const FastCarInfoSection = memo<FastCarInfoSectionProps>(({ 
  form,
  brands,
  models,
  watchBrandId,
  isLoadingCarData
}) => {
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  
  // Memoize options to prevent recreating arrays
  const brandOptions = useMemo(() => brands, [brands]);
  const modelOptions = useMemo(() => models, [models]);

  return (
    <div className="fast-car-info">
      <div className="mobile-grid-2">
        <FormField
          control={form.control}
          name="brandId"
          render={({ field }) => (
            <FormItem className="mobile-form-item">
              <FormLabel className="mobile-form-label">{t.labels.brand}</FormLabel>
              <FormControl>
                <EnhancedVirtualizedSelect
                  options={brandOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t.placeholders.selectBrand}
                  searchPlaceholder={t.placeholders.searchBrand}
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
            <FormItem className="mobile-form-item">
              <FormLabel className="mobile-form-label">{t.labels.model} {t.optional}</FormLabel>
              <FormControl>
                <EnhancedVirtualizedSelect
                  options={modelOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={watchBrandId ? t.placeholders.selectModel : t.placeholders.firstSelectBrand}
                  searchPlaceholder={t.placeholders.searchModel}
                  disabled={!watchBrandId || isLoadingCarData}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
});

FastCarInfoSection.displayName = "FastCarInfoSection";

export default FastCarInfoSection;