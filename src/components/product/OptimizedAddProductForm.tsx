
import React, { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useOptimizedBrandSearch } from "@/hooks/useOptimizedBrandSearch";
import FormSectionWrapper from "./form/FormSectionWrapper";
import BasicInfoSection from "./form/BasicInfoSection";
import CarInfoSection from "./form/CarInfoSection";
import MediaSection from "./form/MediaSection";

// Product form schema with zod validation
export const productSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  price: z.string().min(1, {
    message: "Укажите цену товара",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Цена должна быть положительным числом",
  }),
  brandId: z.string().min(1, {
    message: "Выберите марку автомобиля",
  }),
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, {
    message: "Укажите количество мест",
  }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, {
    message: "Количество мест должно быть целым положительным числом",
  }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface OptimizedAddProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  brands: Array<{id: string, name: string}>;
  brandModels: Array<{id: string, name: string, brand_id: string}>;
  isLoadingCarData: boolean;
  watchBrandId: string;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
}

const OptimizedAddProductForm = React.memo<OptimizedAddProductFormProps>(({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  brands,
  brandModels,
  isLoadingCarData,
  watchBrandId,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  handleMobileOptimizedImageUpload,
  setVideoUrls
}) => {
  const { filteredBrands, filteredModels } = useOptimizedBrandSearch(
    brands,
    brandModels,
    searchBrandTerm,
    searchModelTerm,
    watchBrandId
  );

  const handleSubmit = useCallback((values: ProductFormValues) => {
    onSubmit(values);
  }, [onSubmit]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormSectionWrapper title="Основная информация">
          <BasicInfoSection form={form} />
        </FormSectionWrapper>
        
        <FormSectionWrapper title="Информация об автомобиле">
          <CarInfoSection
            form={form}
            filteredBrands={filteredBrands}
            filteredModels={filteredModels}
            searchBrandTerm={searchBrandTerm}
            setSearchBrandTerm={setSearchBrandTerm}
            searchModelTerm={searchModelTerm}
            setSearchModelTerm={setSearchModelTerm}
            watchBrandId={watchBrandId}
            isLoadingCarData={isLoadingCarData}
          />
        </FormSectionWrapper>
        
        <FormSectionWrapper title="Медиа файлы">
          <MediaSection
            imageUrls={imageUrls}
            videoUrls={videoUrls}
            handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
            setVideoUrls={setVideoUrls}
          />
        </FormSectionWrapper>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Публикация...
            </>
          ) : (
            'Опубликовать'
          )}
        </Button>
      </form>
    </Form>
  );
});

OptimizedAddProductForm.displayName = "OptimizedAddProductForm";

export default OptimizedAddProductForm;
