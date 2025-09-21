import React, { Suspense } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";
import FormSectionWrapper from '../product/form/FormSectionWrapper';
import BasicInfoSection from "../product/form/BasicInfoSection";
import SellerSelectionSection from "../product/form/SellerSelectionSection";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";

// Lazy loaded components
const OptimizedMediaSection = React.lazy(() => import('../product/form/OptimizedMediaSection'));

interface Seller {
  id: string;
  full_name: string;
  opt_id?: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface AdminAddProductFormProps {
  form: UseFormReturn<AdminProductFormValues>;
  onSubmit: (values: AdminProductFormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  setVideoUrls: (urls: string[]) => void;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  onImageDelete?: (url: string) => void;
  sellers: Seller[];
  brands: Brand[];
  brandModels: Model[];
  isLoadingCarData: boolean;
}

// Car Info Section Component
const CarInfoSection: React.FC<{
  form: UseFormReturn<AdminProductFormValues>;
  brands: Brand[];
  brandModels: Model[];
  isLoadingCarData: boolean;
}> = ({ form, brands, brandModels, isLoadingCarData }) => {
  return (
    <div className="space-y-4">
      {/* Brand Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Марка автомобиля</label>
        <select
          {...form.register("brandId")}
          className="w-full px-3 py-2 border border-input rounded-md bg-background"
          disabled={isLoadingCarData}
        >
          <option value="">Выберите марку</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        {form.formState.errors.brandId && (
          <p className="text-sm text-destructive">{form.formState.errors.brandId.message}</p>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Модель автомобиля</label>
        <select
          {...form.register("modelId")}
          className="w-full px-3 py-2 border border-input rounded-md bg-background"
          disabled={isLoadingCarData || !form.watch("brandId")}
        >
          <option value="">Выберите модель</option>
          {brandModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        {form.formState.errors.modelId && (
          <p className="text-sm text-destructive">{form.formState.errors.modelId.message}</p>
        )}
      </div>
    </div>
  );
};

// Delivery Info Section Component
const DeliveryInfoSection: React.FC<{
  form: UseFormReturn<AdminProductFormValues>;
}> = ({ form }) => {
  return (
    <div className="space-y-4">
      {/* Place Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Количество мест</label>
        <input
          {...form.register("placeNumber")}
          type="number"
          min="1"
          className="w-full px-3 py-2 border border-input rounded-md bg-background"
          placeholder="1"
        />
        {form.formState.errors.placeNumber && (
          <p className="text-sm text-destructive">{form.formState.errors.placeNumber.message}</p>
        )}
      </div>

      {/* Delivery Price */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Стоимость доставки (опционально)</label>
        <input
          {...form.register("deliveryPrice")}
          type="number"
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-input rounded-md bg-background"
          placeholder="0"
        />
        {form.formState.errors.deliveryPrice && (
          <p className="text-sm text-destructive">{form.formState.errors.deliveryPrice.message}</p>
        )}
      </div>
    </div>
  );
};

const AdminAddProductForm: React.FC<AdminAddProductFormProps> = ({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  setVideoUrls,
  handleMobileOptimizedImageUpload,
  primaryImage,
  setPrimaryImage,
  onImageDelete,
  sellers,
  brands,
  brandModels,
  isLoadingCarData,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Media Section */}
        <FormSectionWrapper title="Медиа файлы">
          <Suspense fallback={<div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <OptimizedMediaSection 
              imageUrls={imageUrls}
              handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
              primaryImage={primaryImage}
              onSetPrimaryImage={setPrimaryImage}
              onImageDelete={onImageDelete}
            />
          </Suspense>
        </FormSectionWrapper>

        {/* Video Files Section */}
        <FormSectionWrapper title="Видео файлы">
          <CloudinaryVideoUpload
            videos={videoUrls}
            onUpload={setVideoUrls}
            onDelete={(urlToDelete) => {
              setVideoUrls(videoUrls.filter(url => url !== urlToDelete));
            }}
            maxVideos={3}
          />
        </FormSectionWrapper>

        {/* Basic Info Section */}
        <FormSectionWrapper title="Основная информация">
          <BasicInfoSection form={form} />
        </FormSectionWrapper>

        {/* Car Info Section */}
        <FormSectionWrapper title="Информация об автомобиле">
          <CarInfoSection 
            form={form}
            brands={brands}
            brandModels={brandModels}
            isLoadingCarData={isLoadingCarData}
          />
        </FormSectionWrapper>

        {/* Seller Selection */}
        <FormSectionWrapper title="Продавец">
          <SellerSelectionSection 
            form={form}
            sellers={sellers}
          />
        </FormSectionWrapper>

        {/* Delivery Info Section */}
        <FormSectionWrapper title="Информация о доставке">
          <DeliveryInfoSection form={form} />
        </FormSectionWrapper>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Создание товара...
            </>
          ) : (
            "Создать товар"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AdminAddProductForm;