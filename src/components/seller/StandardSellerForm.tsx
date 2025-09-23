import React, { useState, useCallback, useMemo } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import OptimizedMediaSection from "@/components/product/form/OptimizedMediaSection";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { useDebounce } from "@/hooks/useDebounce";
import { useStandardSellerProductCreation } from "@/hooks/useStandardSellerProductCreation";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { logger } from "@/utils/logger";

const StandardSellerForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { createStandardSellerProduct, isCreating, currentUserProfile, isProfileLoading } = useStandardSellerProductCreation();
  const { guardedSubmit, canSubmit } = useSubmissionGuard({ 
    timeout: 3000,
    onDuplicateSubmit: () => logger.warn('⚠️ Duplicate submission attempt blocked')
  });
  
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  
  const [displayData, setDisplayData] = useState({
    title: "",
    price: "",
    description: ""
  });
  
  const debouncedTitle = useDebounce(displayData.title, 300);
  const debouncedPrice = useDebounce(displayData.price, 300);
  const debouncedDescription = useDebounce(displayData.description, 300);
  
  const formData = {
    title: debouncedTitle,
    price: debouncedPrice,
    description: debouncedDescription
  };
  
  const [isSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState("");
  const [isMediaUploading, setIsMediaUploading] = useState(false);

  const updateForm = (field: keyof typeof displayData, value: string) => {
    setDisplayData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = useCallback((urls: string[]) => {
    unstable_batchedUpdates(() => {
      setImageUrls(prevUrls => [...prevUrls, ...urls]);
      
      setPrimaryImage(prev => {
        if (!prev && urls.length > 0) {
          return urls[0];
        }
        return prev;
      });
    });
  }, []);

  const handleImageDelete = useCallback((url: string) => {
    unstable_batchedUpdates(() => {
      setImageUrls(prevUrls => {
        const newUrls = prevUrls.filter(item => item !== url);
        
        setPrimaryImage(prevPrimary => {
          if (prevPrimary === url) {
            return newUrls.length > 0 ? newUrls[0] : "";
          }
          return prevPrimary;
        });
        
        return newUrls;
      });
    });
  }, []);

  const handleSetPrimaryImage = useCallback((url: string) => {
    setPrimaryImage(url);
  }, []);

  const handleUploadStateChange = useCallback((uploading: boolean) => {
    setIsMediaUploading(uploading);
  }, []);

  // Мемоизируем пропсы для OptimizedMediaSection
  const mediaProps = useMemo(() => ({
    imageUrls,
    handleMobileOptimizedImageUpload: handleImageUpload,
    primaryImage,
    onSetPrimaryImage: handleSetPrimaryImage,
    onImageDelete: handleImageDelete,
    disabled: isSubmitting,
    onUploadStateChange: handleUploadStateChange
  }), [
    imageUrls,
    primaryImage,
    isSubmitting,
    handleImageUpload,
    handleImageDelete,
    handleSetPrimaryImage,
    handleUploadStateChange
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await guardedSubmit(async () => {
      logger.debug('📝 Standard seller form submission started');
      
      // КРИТИЧНО: Проверяем загрузку профиля
      if (isProfileLoading) {
        toast({
          title: "Подождите",
          description: "Загружаются данные профиля...",
          variant: "default",
        });
        return;
      }
      
      if (!currentUserProfile) {
        toast({
          title: "Ошибка профиля",
          description: "Не удалось загрузить профиль. Попробуйте обновить страницу.",
          variant: "destructive",
        });
        return;
      }
      
      // Basic validation
      if (!formData.title.trim()) {
        toast({
          title: c.errors.title,
          description: t.validation.titleRequired,
          variant: "destructive",
        });
        return;
      }

      if (!formData.price || Number(formData.price) <= 0) {
        toast({
          title: c.errors.title, 
          description: t.validation.priceRequired,
          variant: "destructive",
        });
        return;
      }

      if (imageUrls.length === 0) {
        toast({
          title: c.errors.title,
          description: t.messages.imageRequired,
          variant: "destructive",
        });
        return;
      }

      try {
        const productId = await createStandardSellerProduct({
          title: formData.title,
          price: Number(formData.price),
          description: formData.description,
          imageUrls,
          primaryImage
        });

        navigate(`/seller/product/${productId}?from=add`);
        
      } catch (error) {
        logger.error("💥 Form submission error:", error);
        // Error handling is done in the hook
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <OptimizedMediaSection {...mediaProps} />
      
      <div>
        <label className="block text-sm font-medium mb-2">
          {t.labels.title} *
        </label>
        <textarea
          value={displayData.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder={t.placeholders.title}
          className="w-full p-3 border border-input rounded-lg bg-background h-24 resize-none"
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          {t.labels.price} *
        </label>
        <input
          type="number"
          value={displayData.price}
          onChange={(e) => updateForm('price', e.target.value)}
          placeholder={t.placeholders.price}
          className="w-full p-3 border border-input rounded-lg bg-background"
          required
          min={1}
          step="0.01"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          {t.labels.description} {t.optional}
        </label>
        <textarea
          value={displayData.description}
          onChange={(e) => updateForm('description', e.target.value)}
          placeholder={t.placeholders.description}
          className="w-full p-3 border border-input rounded-lg bg-background h-24 resize-none"
          disabled={isSubmitting}
        />
      </div>
      
      {isProfileLoading && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">🔄 Загрузка данных профиля...</p>
        </div>
      )}
      
      {!currentUserProfile && !isProfileLoading && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">⚠️ Профиль не загружен. Обновите страницу.</p>
        </div>
      )}
      
      <Button
        type="submit"
        disabled={isCreating || isMediaUploading || isProfileLoading || !currentUserProfile || !canSubmit}
        className="w-full"
        size="lg"
      >
        {isProfileLoading 
          ? "Загрузка профиля..." 
          : isCreating 
            ? t.buttons.publishing 
            : t.buttons.publish
        }
      </Button>
    </form>
  );
};

export default React.memo(StandardSellerForm);