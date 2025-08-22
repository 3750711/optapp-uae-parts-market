
import React, { Suspense } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import FormSectionWrapper from './form/FormSectionWrapper';
import SellerSelectionSection from './form/SellerSelectionSection';
import BasicInfoSection from "./form/BasicInfoSection";
import CarInfoSection from "./form/CarInfoSection";

// Экспортируем базовую схему для seller страниц
import { z } from "zod";
import { getProductValidationMessages, ProductValidationMessages } from "@/utils/translations/forms";
import { Lang } from "@/types/i18n";

// Create schema function that accepts translations
export const createProductSchema = (t: ProductValidationMessages) => z.object({
  title: z.string().min(3, { message: t.titleMinLength }),
  price: z.string().min(1, { message: t.priceRequired }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: t.priceInvalid }),
  brandId: z.string().min(1, { message: t.brandRequired }),
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, { message: t.placesRequired }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, { message: t.placesInvalid }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), { message: t.deliveryPriceInvalid }),
  sellerId: z.string().optional(),
});

// Default English schema for backward compatibility
const defaultValidation = getProductValidationMessages('en');
export const productSchema = createProductSchema(defaultValidation);

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
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  sellers?: Array<{ id: string, full_name: string, opt_id?: string }>;
  showSellerSelection?: boolean;
  onImageDelete?: (url: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}

// Always use the optimized media section
const OptimizedMediaSection = React.lazy(() => import('./form/OptimizedMediaSection'));

const AddProductForm: React.FC<AddProductFormProps> = ({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  brands,
  brandModels,
  isLoadingCarData,
  watchBrandId,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  primaryImage,
  setPrimaryImage,
  sellers = [],
  showSellerSelection = false,
  onImageDelete,
  onUploadStateChange,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showSellerSelection && sellers.length > 0 && (
        <FormSectionWrapper title="Seller">
            <SellerSelectionSection form={form} sellers={sellers} />
          </FormSectionWrapper>
        )}

        <FormSectionWrapper title="Basic Information">
          <BasicInfoSection form={form} />
        </FormSectionWrapper>

        <FormSectionWrapper title="Car Information">
          <CarInfoSection
            form={form}
            brands={brands}
            models={brandModels}
            watchBrandId={watchBrandId}
            isLoadingCarData={isLoadingCarData}
          />
        </FormSectionWrapper>
        
        <FormSectionWrapper title="Media Files">
          <Suspense fallback={<div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <OptimizedMediaSection 
              imageUrls={imageUrls}
              videoUrls={videoUrls}
              handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
              setVideoUrls={setVideoUrls}
              primaryImage={primaryImage}
              onSetPrimaryImage={setPrimaryImage}
              onImageDelete={onImageDelete}
              onUploadStateChange={onUploadStateChange}
            />
          </Suspense>
        </FormSectionWrapper>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddProductForm;
