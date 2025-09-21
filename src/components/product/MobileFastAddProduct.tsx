import React, { Suspense, memo, useMemo, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Form } from "@/components/ui/form";
import { ProductFormValues } from './AddProductForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { getFormTranslations } from '@/utils/translations/forms';
import { getCommonTranslations } from '@/utils/translations/common';

// Lazy load components
const OptimizedMediaSection = React.lazy(() => import('./form/OptimizedMediaSection'));
const FastBasicInfoSection = memo(React.lazy(() => import('./form/FastBasicInfoSection')));

interface MobileFastAddProductProps {
  form: UseFormReturn<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  onImageDelete?: (url: string) => void;
  onBack?: () => void;
  onUploadStateChange?: (isUploading: boolean) => void;
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
  handleMobileOptimizedImageUpload,
  primaryImage,
  setPrimaryImage,
  onImageDelete,
  onBack,
  onUploadStateChange,
}) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);

  // Memoize sections to prevent re-renders
  const basicInfoSection = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <FastBasicInfoSection form={form} />
    </Suspense>
  ), [form]);

  const mediaSection = useMemo(() => (
    <Suspense fallback={<LoadingSpinner />}>
      <OptimizedMediaSection 
        imageUrls={imageUrls}
        handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
        primaryImage={primaryImage}
        onSetPrimaryImage={setPrimaryImage}
        onImageDelete={onImageDelete}
        onUploadStateChange={onUploadStateChange}
      />
    </Suspense>
  ), [imageUrls, handleMobileOptimizedImageUpload, primaryImage, setPrimaryImage, onImageDelete, onUploadStateChange]);

  const handleSubmitMemo = useCallback((values: ProductFormValues) => {
    onSubmit(values);
  }, [onSubmit]);

  const handleBackMemo = useCallback(() => {
    onBack?.();
  }, [onBack]);

  return (
    <div className="mobile-fast-form animate-fade-in">
      <div className="mobile-optimized pb-safe">
        {/* Enhanced Mobile Header with safe area support */}
        <div className="mobile-header pt-safe border-b border-border/20">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackMemo}
                className="touch-target flex items-center gap-2 hover:bg-accent/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">{c.buttons.back}</span>
              </Button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{t.sections.addProduct}</h1>
              <p className="text-sm text-muted-foreground">{t.sections.productDescription}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitMemo)} className="space-y-6">
            {/* Enhanced Media Files Section - First */}
            <section className="mobile-section bg-card shadow-sm border border-border/50 rounded-xl overflow-hidden" aria-label={t.sections.mediaFiles}>
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 border-b border-border/30">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  {t.sections.mediaFiles}
                </h2>
              </div>
              <div className="p-4">
                {mediaSection}
              </div>
            </section>

            {/* Enhanced Basic Information Section */}
            <section className="mobile-section bg-card shadow-sm border border-border/50 rounded-xl overflow-hidden" aria-label={t.sections.basicInformation}>
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 border-b border-border/30">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  {t.sections.basicInformation}
                </h2>
              </div>
              <div className="p-4">
                {basicInfoSection}
              </div>
            </section>
            
            {/* Enhanced Submit Button - Mobile Sticky with better spacing */}
            <div className="pb-24">
              <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4 z-50 pb-safe shadow-lg">
                <div className="max-w-sm mx-auto">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium touch-target bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t.messages.uploadingMedia}
                      </>
                    ) : (
                      t.sections.publishProduct
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});

MobileFastAddProduct.displayName = "MobileFastAddProduct";

export default MobileFastAddProduct;