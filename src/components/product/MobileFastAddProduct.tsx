import React, { Suspense, memo, useMemo, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Form } from "@/components/ui/form";
import { ProductFormValues } from './AddProductForm';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load heavy components
const OptimizedMediaSection = React.lazy(() => import('./form/OptimizedMediaSection'));
const FastBasicInfoSection = memo(React.lazy(() => import('./form/FastBasicInfoSection')));
const FastCarInfoSection = memo(React.lazy(() => import('./form/FastCarInfoSection')));

interface MobileFastAddProductProps {
  form: UseFormReturn<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  brands: Array<{ id: string, name: string }>;
  brandModels: Array<{ id: string, name: string, brand_id: string }>;
  isLoadingCarData: boolean;
  watchBrandId: string;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  onImageDelete?: (url: string) => void;
  onBack?: () => void;
}

const LoadingSpinner = memo(() => (
  <div className="mobile-spinner">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
));

const MobileFastAddProduct: React.FC<MobileFastAddProductProps> = memo(({
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
  onImageDelete,
  onBack,
}) => {
  const isMobile = useIsMobile();

  // Memoize sections to prevent re-renders
  const basicInfoSection = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <FastBasicInfoSection form={form} />
    </Suspense>
  ), [form]);

  const carInfoSection = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <FastCarInfoSection
        form={form}
        brands={brands}
        models={brandModels}
        watchBrandId={watchBrandId}
        isLoadingCarData={isLoadingCarData}
      />
    </Suspense>
  ), [form, brands, brandModels, watchBrandId, isLoadingCarData]);

  const mediaSection = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <OptimizedMediaSection 
        imageUrls={imageUrls}
        videoUrls={videoUrls}
        handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
        setVideoUrls={setVideoUrls}
        primaryImage={primaryImage}
        onSetPrimaryImage={setPrimaryImage}
        onImageDelete={onImageDelete}
      />
    </Suspense>
  ), [imageUrls, videoUrls, handleMobileOptimizedImageUpload, setVideoUrls, primaryImage, setPrimaryImage, onImageDelete]);

  const handleSubmitMemo = useCallback((values: ProductFormValues) => {
    onSubmit(values);
  }, [onSubmit]);

  const handleBackMemo = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className={`mobile-fast-form ${isMobile ? 'mobile-optimized' : 'desktop-optimized'}`}>
      {/* Mobile-optimized header */}
      <div className="mobile-header">
        {onBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackMemo}
            className="mobile-back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <h1 className="mobile-title">Add Product</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitMemo)} className="mobile-form-grid">
          {/* Basic Info Section */}
          <section className="mobile-section" aria-label="Basic Information">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">Basic Information</h2>
            </div>
            <div className="mobile-section-content">
              {basicInfoSection}
            </div>
          </section>

          {/* Car Info Section */}
          <section className="mobile-section" aria-label="Car Information">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">Car Information</h2>
            </div>
            <div className="mobile-section-content">
              {carInfoSection}
            </div>
          </section>
          
          {/* Media Section - Load only when in viewport */}
          <section className="mobile-section" aria-label="Media Files">
            <div className="mobile-section-header">
              <h2 className="mobile-section-title">Media Files</h2>
            </div>
            <div className="mobile-section-content">
              {mediaSection}
            </div>
          </section>
          
          {/* Submit Button */}
          <div className="mobile-submit-section">
            <Button 
              type="submit" 
              className="mobile-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Product'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
});

MobileFastAddProduct.displayName = "MobileFastAddProduct";

export default MobileFastAddProduct;