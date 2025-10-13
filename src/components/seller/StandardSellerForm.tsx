import React, { useState, useCallback, useMemo, useEffect } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import { CloudinaryPhotoUploader } from "@/components/uploader/CloudinaryPhotoUploader";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { useDebounce } from "@/hooks/useDebounce";
import { useStandardSellerProductCreation } from "@/hooks/useStandardSellerProductCreation";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useSubmissionGuard } from "@/hooks/useSubmissionGuard";
import { useSellerUploadProtection } from "@/hooks/useSellerUploadProtection";
import { logger } from "@/utils/logger";

const StandardSellerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  const { createStandardSellerProduct, isCreating, currentUserProfile, isProfileLoading } = useStandardSellerProductCreation();
  const { refetch: refetchProfile } = useCurrentUserProfile();
  const { guardedSubmit, canSubmit } = useSubmissionGuard({ 
    timeout: 3000,
    onDuplicateSubmit: () => logger.warn('⚠️ Duplicate submission attempt blocked')
  });

  // Profile loading timeout state
  const [profileTimeout, setProfileTimeout] = useState(false);  
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Profile loading timeout logic
  useEffect(() => {
    if (isProfileLoading) {
      const timer = setTimeout(() => {
        setProfileTimeout(true);
        setShowProfileWarning(true);
        logger.warn('⏱️ Profile loading timeout after 10 seconds');
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timer);
    } else {
      setProfileTimeout(false);
      setShowProfileWarning(false);
    }
  }, [isProfileLoading]);
  
  // Используем Cloudinary Widget для всех страниц
  
  const [displayData, setDisplayData] = useState({
    title: "",
    price: "",
    description: ""
  });
  
  const debouncedTitle = useDebounce(displayData.title, 300);
  const debouncedPrice = useDebounce(displayData.price, 300);
  const debouncedDescription = useDebounce(displayData.description, 300);
  
  // P0-1: Мемоизированные данные формы для предотвращения лишних ре-рендеров
  const formData = useMemo(() => ({
    title: debouncedTitle,
    price: debouncedPrice,
    description: debouncedDescription
  }), [debouncedTitle, debouncedPrice, debouncedDescription]);

  
  const [isSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState("");
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // P0-1: Мемоизированная валидация формы  
  const isFormValid = useMemo(() => {
    return formData.title.trim() && 
           formData.price && 
           Number(formData.price) > 0 && 
           imageUrls.length > 0;
  }, [formData.title, formData.price, imageUrls.length]);

  // Показывать ошибки валидации только если виджет закрыт
  const shouldShowValidationErrors = !isWidgetOpen;

  // Упрощенная логика состояния Submit кнопки
  const getSubmitState = useMemo(() => {
    const isFormBlocked = isCreating || !canSubmit;
    const isFormIncomplete = !isFormValid && shouldShowValidationErrors;
    const isProfileBlocked = isProfileLoading && !profileTimeout;
    const allowWithoutProfile = showProfileWarning && !currentUserProfile;
    
    return {
      disabled: isFormBlocked || isFormIncomplete || isProfileBlocked,
      text: isWidgetOpen
        ? "Cloudinary Widget открыт..."
        : isProfileLoading && !profileTimeout
          ? "Загрузка профиля..." 
          : isCreating 
            ? t.buttons.publishing 
            : allowWithoutProfile
              ? "Отправить без профиля" 
              : t.buttons.publish
    };
  }, [isCreating, canSubmit, isFormValid, shouldShowValidationErrors, isProfileLoading, profileTimeout, showProfileWarning, currentUserProfile, isWidgetOpen, t.buttons]);

  // Upload protection hook
  useSellerUploadProtection({
    isUploading: isCreating,
    warningMessage: "Создание товара не завершено. Вы уверены, что хотите покинуть страницу?"
  });

  // P1-1: Autosave draft to localStorage with debounce
  const saveDraft = React.useCallback(() => {
    if (formData.title || formData.description || formData.price || imageUrls.length > 0) {
      const draft = { 
        ...formData, 
        imageUrls, 
        primaryImage,
        timestamp: Date.now() 
      };
      try {
        localStorage.setItem('seller-product-draft', JSON.stringify(draft));
        console.log('💾 Draft saved to localStorage:', {
          imagesCount: imageUrls.length,
          primaryImage: primaryImage ? 'set' : 'empty',
          timestamp: draft.timestamp
        });
      } catch (error) {
        console.warn('Failed to save draft:', error);
      }
    }
  }, [formData, imageUrls, primaryImage]);

  // Debounced autosave
  const debouncedSave = React.useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(saveDraft, 1000);
      };
    },
    [saveDraft]
  );

  React.useEffect(() => {
    debouncedSave();
  }, [formData.title, formData.description, formData.price, imageUrls, primaryImage, debouncedSave]);

  // P1-1: Restore draft on component mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('seller-product-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        const age = Date.now() - (draft.timestamp || 0);
        
        console.log('📦 Checking draft:', {
          exists: true,
          age: Math.round(age / 1000 / 60), // minutes
          imagesCount: draft.imageUrls?.length || 0,
          timestamp: new Date(draft.timestamp).toISOString()
        });
        
        // Restore only if younger than 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          setDisplayData({
            title: draft.title || "",
            price: draft.price || "",
            description: draft.description || ""
          });
          if (Array.isArray(draft.imageUrls)) {
            setImageUrls(draft.imageUrls);
            console.log('✅ Restored images:', draft.imageUrls.length);
          }
          if (draft.primaryImage) {
            setPrimaryImage(draft.primaryImage);
            console.log('✅ Restored primary image');
          }
          console.log('📦 Draft restored successfully');
        } else {
          // Remove expired draft
          localStorage.removeItem('seller-product-draft');
          console.log('🗑️ Expired draft removed (age: ' + Math.round(age / 1000 / 60 / 60) + ' hours)');
        }
      } else {
        console.log('📦 No draft found in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to restore draft:', error);
      localStorage.removeItem('seller-product-draft'); // Remove corrupted draft
    }
  }, []);

  const updateForm = (field: keyof typeof displayData, value: string) => {
    setDisplayData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = useCallback((urls: string[]) => {
    unstable_batchedUpdates(() => {
      setImageUrls(prevUrls => {
        // Фильтруем дубликаты
        const newUrls = urls.filter(url => !prevUrls.includes(url));
        if (newUrls.length === 0) {
          console.log('🚫 No new URLs to add, skipping update');
          return prevUrls;
        }
        return [...prevUrls, ...newUrls];
      });
      
      setPrimaryImage(prev => {
        if (!prev && urls.length > 0) {
          return urls[0];
        }
        return prev;
      });
    });
  }, []);

  const handleImageDelete = useCallback((url: string) => {
    console.log('🗑️ Deleting image from state:', url);
    unstable_batchedUpdates(() => {
      setImageUrls(prevUrls => {
        const newUrls = prevUrls.filter(item => item !== url);
        console.log('📊 Images after deletion:', { 
          before: prevUrls.length, 
          after: newUrls.length,
          deleted: url 
        });
        
        setPrimaryImage(prevPrimary => {
          if (prevPrimary === url) {
            const newPrimary = newUrls.length > 0 ? newUrls[0] : "";
            console.log('🖼️ Primary image changed:', { old: url, new: newPrimary });
            return newPrimary;
          }
          return prevPrimary;
        });
        
        return newUrls;
      });
    });

    // 🔥 CRITICAL FIX: Force immediate save after deletion
    setTimeout(() => {
      const currentData = {
        title: displayData.title,
        price: displayData.price,
        description: displayData.description
      };
      const newImageUrls = imageUrls.filter(item => item !== url);
      const newPrimaryImage = primaryImage === url 
        ? (newImageUrls.length > 0 ? newImageUrls[0] : "")
        : primaryImage;

      const draft = {
        ...currentData,
        imageUrls: newImageUrls,
        primaryImage: newPrimaryImage,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('seller-product-draft', JSON.stringify(draft));
        console.log('✅ Draft force-saved after deletion:', {
          imagesCount: newImageUrls.length,
          deletedUrl: url,
          timestamp: draft.timestamp
        });
      } catch (error) {
        console.error('❌ Failed to force-save draft:', error);
      }
    }, 100);
  }, [imageUrls, primaryImage, displayData]);

  const handleSetPrimaryImage = useCallback((url: string) => {
    setPrimaryImage(url);
  }, []);

  const handleRetryProfile = useCallback(async () => {
    if (retryCount >= 3) return;
    
    setRetryCount(prev => prev + 1);
    setProfileTimeout(false);
    setShowProfileWarning(false);
    
    logger.log(`🔄 Retry profile loading attempt ${retryCount + 1}/3`);
    
    try {
      await refetchProfile();
    } catch (error) {
      logger.error('❌ Profile retry failed:', error);
      // Toast будет показан автоматически через react-query retry логику
    }
  }, [retryCount, refetchProfile]);


  // Handle photo uploads from CloudinaryPhotoUploader
  const onCloudinaryUpload = useCallback((newUrls: string[]) => {
    console.log('📤 Cloudinary upload completed:', newUrls);
    handleImageUpload(newUrls);
  }, [handleImageUpload]);

  const onImageDelete = useCallback((urlToDelete: string) => {
    console.log('🗑️ Deleting image:', urlToDelete);
    handleImageDelete(urlToDelete);
  }, [handleImageDelete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await guardedSubmit(async () => {
      logger.debug('📝 Standard seller form submission started');
      
      // КРИТИЧНО: Проверяем загрузку профиля с timeout
      if (isProfileLoading && !profileTimeout) {
        toast({
          title: "Подождите",
          description: "Загружаются данные профиля...",
          variant: "default",
        });
        return;
      }

      // Если профиль не загрузился за 10 секунд, показываем предупреждение
      if (!currentUserProfile && (isProfileLoading || profileTimeout)) {
        if (!showProfileWarning) {
          setShowProfileWarning(true);
          toast({
            title: "Проблема с загрузкой профиля",
            description: "Попробуйте обновить страницу или продолжить без профиля",
            variant: "destructive",
          });
          return;
        }
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

        // P1-1: Clear draft after successful creation
        try {
          localStorage.removeItem('seller-product-draft');
          console.log('🗑️ Draft cleared after successful product creation');
        } catch (error) {
          console.warn('Failed to clear draft:', error);
        }

        navigate(`/seller/product/${productId}?from=add`);
        
      } catch (error) {
        logger.error("💥 Form submission error:", error);
        // Error handling is done in the hook
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">
          {t.labels.productPhotos} *
        </h3>
        <CloudinaryPhotoUploader
          images={imageUrls}
          onImageUpload={onCloudinaryUpload}
          onImageDelete={onImageDelete}
          maxImages={50}
          disabled={isSubmitting}
          onWidgetStateChange={setIsWidgetOpen}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          {t.labels.title} *
        </label>
        <textarea
          value={displayData.title}
          onChange={(e) => updateForm('title', e.target.value)}
          placeholder={t.placeholders.title}
          className="w-full p-3 border border-input rounded-lg bg-background h-24 resize-none"
          disabled={isSubmitting}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Пример: Nose cut Toyota Corolla 2005
        </p>
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
          min={1}
          step="0.01"
          disabled={isSubmitting}
        />
      </div>
      
      {isProfileLoading && !profileTimeout && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">🔄 Загрузка данных профиля...</p>
        </div>
      )}
      
      {showProfileWarning && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Профиль загружается дольше обычного. 
            {retryCount < 3 && (
              <button 
                type="button"
                onClick={handleRetryProfile}
                className="ml-2 underline hover:no-underline"
              >
                Повторить попытку ({retryCount}/3)
              </button>
            )}
          </p>
        </div>
      )}
      
      {!currentUserProfile && !isProfileLoading && profileTimeout && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded mb-4">
          <p className="text-sm text-red-800 dark:text-red-200">⚠️ Профиль не загружен. Обновите страницу.</p>
        </div>
      )}
      
      <Button
        type="submit"
        disabled={getSubmitState.disabled}
        className="w-full"
        size="lg"
      >
        {getSubmitState.text}
      </Button>
    </form>
  );
};

export default React.memo(StandardSellerForm);