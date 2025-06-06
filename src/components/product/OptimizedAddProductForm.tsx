import React, { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useOptimizedBrandSearch } from "@/hooks/useOptimizedBrandSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MobileOptimizedBasicInfoSection from "./form/MobileOptimizedBasicInfoSection";
import MobileOptimizedCarInfoSection from "./form/MobileOptimizedCarInfoSection";
import StickyMobileActions from "@/components/ui/StickyMobileActions";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import VideoUpload from "@/components/ui/video-upload";

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
          
          {/* ОСНОВНАЯ ИНФОРМАЦИЯ + ФОТОГРАФИИ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Основная информация и фотографии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Основные поля формы */}
              <MobileOptimizedBasicInfoSection form={form} />
              
              {/* Загрузка фотографий */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Фотографии товара</h3>
                <MobileOptimizedImageUpload
                  onUploadComplete={handleMobileOptimizedImageUpload}
                  maxImages={30}
                  existingImages={imageUrls}
                  onImageDelete={onImageDelete}
                  onSetPrimaryImage={setPrimaryImage}
                  primaryImage={primaryImage}
                  buttonText="Добавить фотографии"
                />
                {imageUrls.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Добавьте хотя бы одну фотографию для создания товара
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* ИНФОРМАЦИЯ ОБ АВТОМОБИЛЕ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация об автомобиле</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          
          {/* ДОПОЛНИТЕЛЬНО: ВИДЕО */}
          {videoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Видео товара</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoUpload
                  videos={videoUrls}
                  onUpload={(urls) => setVideoUrls(prevUrls => [...prevUrls, ...urls])}
                  onDelete={(urlToDelete) => setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete))}
                  maxVideos={2}
                  storageBucket="Product Images"
                />
              </CardContent>
            </Card>
          )}
          
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
