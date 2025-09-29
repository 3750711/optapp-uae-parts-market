import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminAddProductForm from "@/components/admin/AdminAddProductForm";
import { useOptimizedAdminAddProduct } from "@/hooks/useOptimizedAdminAddProduct";
import ProductPreviewDialog from "@/components/admin/ProductPreviewDialog";
import ProductCreationProgress from "@/components/admin/ProductCreationProgress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TrustedSellerIndicator } from "./TrustedSellerIndicator";
import { useSellerUploadProtection } from "@/hooks/useSellerUploadProtection";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { preWarm } from "@/workers/uploadWorker.singleton";

interface TrustedSellerFormProps {
  mode?: 'trusted_seller';
}

const TrustedSellerForm: React.FC<TrustedSellerFormProps> = ({ mode = 'trusted_seller' }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  
  const {
    form,
    onSubmit,
    isSubmitting,
    imageUrls,
    videoUrls,
    setVideoUrls,
    primaryImage,
    setPrimaryImage,
    sellers,
    brands,
    brandModels,
    isLoadingCarData,
    handleMobileOptimizedImageUpload,
    handleImageDelete,
    isPreviewOpen,
    closePreview,
    richPreviewData,
    handleConfirmPublish,
    isPublished,
    resetFormAndState,
    progressSteps,
    totalProgress,
  } = useOptimizedAdminAddProduct({ 
    mode: 'trusted_seller',
    sellerId: user?.id 
  });

  // Upload protection for trusted sellers
  useSellerUploadProtection({
    isUploading: isSubmitting,
    uploadProgress: totalProgress,
    warningMessage: "Создание товара не завершено. Вы уверены, что хотите покинуть страницу?"
  });

  // Pre-warm worker for better upload performance
  useEffect(() => {
    let cancelled = false;
    (async () => {
      console.log('🔥 TrustedSellerForm: Pre-warming worker...');
      const success = await preWarm({ retries: 3, delayMs: 400 });
      if (!cancelled) {
        console.log(success ? '✅ TrustedSellerForm: Worker pre-warmed' : '⚠️ TrustedSellerForm: Worker pre-warm failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRefreshPage = () => {
    window.location.reload();
  };

  if (isPublished) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">
            {t.messages.productPublishedSuccess}
          </CardTitle>
          <CardDescription>
            {t.messages.refreshPageRequired}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleRefreshPage}
              size="lg" 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {c.buttons.refresh}
            </Button>
            <Button 
              onClick={resetFormAndState}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {t.messages.clearDataWithoutRefresh}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t.messages.refreshPageGuarantee}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TrustedSellerIndicator />
      
      {/* Progress indicator during submission */}
      {(isSubmitting || totalProgress > 0) && (
        <ProductCreationProgress
          steps={progressSteps}
          totalProgress={totalProgress}
        />
      )}
      
      <AdminAddProductForm
        form={form}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        imageUrls={imageUrls}
        videoUrls={videoUrls}
        setVideoUrls={setVideoUrls}
        handleMobileOptimizedImageUpload={handleMobileOptimizedImageUpload}
        primaryImage={primaryImage}
        setPrimaryImage={setPrimaryImage}
        onImageDelete={handleImageDelete}
        sellers={sellers}
        brands={brands}
        brandModels={brandModels}
        isLoadingCarData={isLoadingCarData}
        mode={mode}
      />
      
      <ProductPreviewDialog
        isOpen={isPreviewOpen}
        onClose={closePreview}
        onConfirm={handleConfirmPublish}
        productData={richPreviewData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TrustedSellerForm;