
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import FormSectionWrapper from './form/FormSectionWrapper';
import SellerSelectionSection from './form/SellerSelectionSection';
import BasicInfoSection from "./form/BasicInfoSection";
import CarInfoSection from "./form/CarInfoSection";
import MediaSection from "./form/MediaSection";

// Экспортируем базовую схему для seller страниц
import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(3, { message: "Название должно содержать не менее 3 символов" }),
  price: z.string().min(1, { message: "Укажите цену товара" }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Цена должна быть положительным числом" }),
  brandId: z.string().min(1, { message: "Выберите марку автомобиля" }),
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, { message: "Укажите количество мест" }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, { message: "Количество мест должно быть целым положительным числом" }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), { message: "Стоимость доставки должна быть числом" }),
  sellerId: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// Типы для универсального использования формы
type FormValues = ProductFormValues | import("@/schemas/adminProductSchema").AdminProductFormValues;

interface AddProductFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  userId?: string;
  brands: Array<{ id: string, name: string }>;
  brandModels: Array<{ id: string, name: string, brand_id: string }>;
  isLoadingCarData: boolean;
  watchBrandId: string;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: Array<{ id: string, name: string }>;
  filteredModels: Array<{ id: string, name: string, brand_id: string }>;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  sellers?: Array<{ id: string, full_name: string, opt_id?: string }>;
  showSellerSelection?: boolean;
  onImageDelete?: (url: string) => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  isLoadingCarData,
  watchBrandId,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  filteredBrands,
  filteredModels,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  primaryImage,
  setPrimaryImage,
  sellers = [],
  showSellerSelection = false,
  onImageDelete,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showSellerSelection && sellers.length > 0 && (
          <FormSectionWrapper title="Продавец">
            <SellerSelectionSection form={form} sellers={sellers} />
          </FormSectionWrapper>
        )}

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
        
        <FormSectionWrapper title="Медиафайлы">
           <MediaSection 
              imageUrls={imageUrls}
              videoUrls={videoUrls}
              handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
              setVideoUrls={setVideoUrls}
              primaryImage={primaryImage}
              onSetPrimaryImage={setPrimaryImage}
              onImageDelete={onImageDelete}
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
};

export default AddProductForm;
