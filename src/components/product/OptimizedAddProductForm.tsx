
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
import MediaSection from "./form/MediaSection";
import SimpleSellerSelect from "@/components/admin/SimpleSellerSelect";
import StickyMobileActions from "@/components/ui/StickyMobileActions";

// Схема продукта с валидацией zod
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
  sellerId: z.string().optional(),
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
  sellers?: Array<{id: string, full_name: string, opt_id?: string}>;
  isLoadingSellers?: boolean;
  sellersError?: string | null;
  onRefetchSellers?: () => void;
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
  onImageDelete,
  sellers = [],
  isLoadingSellers = false,
  sellersError = null,
  onRefetchSellers
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

  const hasRequiredData = imageUrls.length > 0 || sellers.length > 0;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
          
          {/* ВЫБОР ПРОДАВЦА */}
          {sellers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Продавец</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleSellerSelect
                  form={form}
                  sellers={sellers}
                  isLoading={isLoadingSellers}
                  error={sellersError}
                  onRefetch={onRefetchSellers}
                />
              </CardContent>
            </Card>
          )}
          
          {/* МЕДИА ФАЙЛЫ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Фотографии и видео товара</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaSection
                imageUrls={imageUrls}
                videoUrls={videoUrls}
                handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
                setVideoUrls={setVideoUrls}
                onImageDelete={onImageDelete}
                onSetPrimaryImage={setPrimaryImage}
                primaryImage={primaryImage}
              />
            </CardContent>
          </Card>
          
          {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Основная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <MobileOptimizedBasicInfoSection form={form} />
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
          
          {!isMobile && (
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !hasRequiredData}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание товара...
                </>
              ) : !hasRequiredData ? (
                'Добавьте данные для создания товара'
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
        disabled={!hasRequiredData}
        submitText={!hasRequiredData ? 'Добавьте данные' : 'Создать товар'}
      />
    </>
  );
});

OptimizedAddProductForm.displayName = "OptimizedAddProductForm";

export default OptimizedAddProductForm;
