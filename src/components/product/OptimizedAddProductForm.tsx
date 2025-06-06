
import React, { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useOptimizedBrandSearch } from "@/hooks/useOptimizedBrandSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileOptimizedForm from "@/components/ui/MobileOptimizedForm";
import MobileOptimizedBasicInfoSection from "./form/MobileOptimizedBasicInfoSection";
import MobileOptimizedCarInfoSection from "./form/MobileOptimizedCarInfoSection";
import MediaSection from "./form/MediaSection";
import StickyMobileActions from "@/components/ui/StickyMobileActions";

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
  onImageDelete?: (url: string) => void;
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
  setVideoUrls,
  primaryImage,
  setPrimaryImage,
  onImageDelete
}) => {
  const isMobile = useIsMobile();
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

  const handleFormSubmit = useCallback(() => {
    form.handleSubmit(handleSubmit)();
  }, [form, handleSubmit]);

  const hasImages = imageUrls.length > 0;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
          
          {/* МЕДИА ФАЙЛЫ - ПЕРВАЯ СЕКЦИЯ */}
          <MobileOptimizedForm title="Фотографии товара" defaultOpen={true}>
            <div className="space-y-4">
              {!hasImages && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium text-center">
                    📸 Сначала добавьте фотографии товара
                  </p>
                  <p className="text-blue-600 text-sm text-center mt-1">
                    Минимум 1 фото, максимум 30 фото
                  </p>
                </div>
              )}
              
              {hasImages && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium text-center">
                    ✅ Загружено {imageUrls.length} фото
                  </p>
                </div>
              )}
              
              <MediaSection
                imageUrls={imageUrls}
                videoUrls={videoUrls}
                handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
                setVideoUrls={setVideoUrls}
                onImageDelete={onImageDelete}
                onSetPrimaryImage={setPrimaryImage}
                primaryImage={primaryImage}
              />
            </div>
          </MobileOptimizedForm>
          
          {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
          <MobileOptimizedForm 
            title="Основная информация" 
            defaultOpen={hasImages}
            disabled={!hasImages}
          >
            {!hasImages ? (
              <div className="p-4 text-center text-gray-500">
                <p>Сначала загрузите фотографии товара</p>
              </div>
            ) : (
              <MobileOptimizedBasicInfoSection form={form} />
            )}
          </MobileOptimizedForm>
          
          {/* ИНФОРМАЦИЯ ОБ АВТОМОБИЛЕ */}
          <MobileOptimizedForm 
            title="Информация об автомобиле" 
            defaultOpen={false}
            disabled={!hasImages}
          >
            {!hasImages ? (
              <div className="p-4 text-center text-gray-500">
                <p>Сначала загрузите фотографии товара</p>
              </div>
            ) : (
              <MobileOptimizedCarInfoSection
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
            )}
          </MobileOptimizedForm>
          
          {!isMobile && (
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !hasImages}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание товара...
                </>
              ) : !hasImages ? (
                'Сначала добавьте фотографии'
              ) : (
                'Создать товар'
              )}
            </Button>
          )}
        </form>
      </Form>

      <StickyMobileActions
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        disabled={!hasImages}
        submitText={!hasImages ? 'Добавьте фотографии' : 'Создать товар'}
      />
    </>
  );
});

OptimizedAddProductForm.displayName = "OptimizedAddProductForm";

export default OptimizedAddProductForm;
