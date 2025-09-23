import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OptimizedMediaSection from "@/components/product/form/OptimizedMediaSection";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { useSmartDebounce } from "@/hooks/useSmartDebounce";
import { useStandardSellerProductCreation } from "@/hooks/useStandardSellerProductCreation";
import { useBackgroundCacheWarming } from "@/hooks/useTrustedSellerPrefetch";
import { useOfflineResilience } from "@/hooks/useOfflineResilience";
import { EnhancedErrorBoundary } from "@/components/error/EnhancedErrorBoundary";
import { FormSkeleton } from "@/components/ui/AdvancedSkeletons";
import { logger } from "@/utils/productionLogger";
import { Save, Wifi, WifiOff, Clock } from "lucide-react";

const OptimizedFormWithAutosave = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { createStandardSellerProduct, isCreating, currentUserProfile, isProfileLoading } = useStandardSellerProductCreation();
  
  // Offline resilience and auto-save
  const {
    isOnline,
    queuedActions,
    saveFormData,
    loadFormData,
    queueAction,
    hasQueuedActions,
  } = useOfflineResilience();
  
  // Background cache warming
  useBackgroundCacheWarming();
  
  // Memoized translations
  const translations = useMemo(() => ({
    form: getFormTranslations(language),
    common: getCommonTranslations(language)
  }), [language]);
  
  // Form state with auto-save
  const [displayData, setDisplayData] = useState(() => {
    // Load saved draft on mount
    const savedDraft = loadFormData('seller-product');
    return savedDraft || {
      title: "",
      price: "",
      description: ""
    };
  });
  
  // Smart debouncing with offline support
  const debouncedTitle = useSmartDebounce(displayData.title, {
    minDelay: 150,
    maxDelay: 600,
    adaptiveThreshold: 2
  });
  
  const debouncedPrice = useSmartDebounce(displayData.price, {
    minDelay: 100,
    maxDelay: 400,
    adaptiveThreshold: 1
  });
  
  const debouncedDescription = useSmartDebounce(displayData.description, {
    minDelay: 200,
    maxDelay: 800,
    adaptiveThreshold: 3
  });
  
  // Auto-save debounced form data
  const debouncedFormData = useMemo(() => ({
    title: debouncedTitle,
    price: debouncedPrice,
    description: debouncedDescription
  }), [debouncedTitle, debouncedPrice, debouncedDescription]);
  
  // Auto-save to localStorage
  useEffect(() => {
    if (debouncedFormData.title || debouncedFormData.price || debouncedFormData.description) {
      saveFormData({
        ...debouncedFormData,
        imageUrls,
        primaryImage,
        lastSaved: Date.now(),
      }, 'seller-product');
      logger.log('📝 Form auto-saved');
    }
  }, [debouncedFormData, saveFormData]);
  
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    const savedDraft = loadFormData('seller-product');
    return savedDraft?.imageUrls || [];
  });
  
  const [primaryImage, setPrimaryImage] = useState(() => {
    const savedDraft = loadFormData('seller-product');
    return savedDraft?.primaryImage || "";
  });
  
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);

  const updateForm = useCallback((field: keyof typeof displayData, value: string) => {
    setDisplayData(prev => ({ ...prev, [field]: value }));
    setLastSaveTime(Date.now());
  }, []);

  const handleImageUpload = (urls: string[]) => {
    setImageUrls(prevUrls => {
      const newUrls = [...prevUrls, ...urls];
      // Auto-save images
      saveFormData({
        ...debouncedFormData,
        imageUrls: newUrls,
        primaryImage,
        lastSaved: Date.now(),
      }, 'seller-product');
      return newUrls;
    });
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImageUrls(prevUrls => {
      const newUrls = prevUrls.filter(url => url !== urlToDelete);
      // Auto-save after deletion
      saveFormData({
        ...debouncedFormData,
        imageUrls: newUrls,
        primaryImage: primaryImage === urlToDelete ? (newUrls[0] || '') : primaryImage,
        lastSaved: Date.now(),
      }, 'seller-product');
      return newUrls;
    });
    
    if (primaryImage === urlToDelete) {
      const remainingUrls = imageUrls.filter(url => url !== urlToDelete);
      setPrimaryImage(remainingUrls.length > 0 ? remainingUrls[0] : "");
    }
  };

  const handleUploadStateChange = (isUploading: boolean) => {
    setIsMediaUploading(isUploading);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!debouncedFormData.title.trim()) {
      toast({
        title: translations.form.validation.titleRequired,
        variant: "destructive",
      });
      return;
    }

    if (!debouncedFormData.price.trim()) {
      toast({
        title: translations.form.validation.priceRequired,
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseFloat(debouncedFormData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: translations.form.validation.pricePositive,
        variant: "destructive",
      });
      return;
    }

    if (imageUrls.length === 0) {
      toast({
        title: "Необходимо добавить хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      title: debouncedFormData.title.trim(),
      price: priceNum,
      description: debouncedFormData.description?.trim() || '',
      imageUrls,
      primaryImage
    };

    try {
      if (isOnline) {
        // Online: create product directly
        logger.log("📤 Submitting standard seller product...");
        
        const product = await createStandardSellerProduct(productData);

        if (product?.id) {
          // Clear draft after successful creation
          saveFormData(null, 'seller-product');
          
          toast({
            title: translations.form.messages.productCreated,
          });
          
          navigate(`/products/${product.id}`);
        }
      } else {
        // Offline: queue for later sync
        const actionId = queueAction('CREATE_PRODUCT', productData);
        
        toast({
          title: "Товар сохранен в очереди",
          description: "Товар будет опубликован при восстановлении соединения",
        });
        
        logger.log(`📦 Product queued for sync: ${actionId}`);
        
        // Clear form
        setDisplayData({ title: "", price: "", description: "" });
        setImageUrls([]);
        setPrimaryImage("");
        saveFormData(null, 'seller-product');
      }
    } catch (error) {
      logger.error("❌ Error creating product:", error);
      
      if (!isOnline) {
        // If offline, still queue the action
        queueAction('CREATE_PRODUCT', productData);
        toast({
          title: "Товар сохранен офлайн",
          description: "Товар будет создан при подключении к интернету",
        });
      } else {
        toast({
          title: "Ошибка при создании товара",
          description: error instanceof Error ? error.message : "Попробуйте еще раз",
          variant: "destructive",
        });
      }
    }
  };

  // Loading skeleton
  if (isProfileLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Добавление товара</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!currentUserProfile || currentUserProfile.user_type !== 'seller') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-destructive">Только продавцы могут создавать товары</p>
        </CardContent>
      </Card>
    );
  }

  const canSubmit = !isCreating && !isMediaUploading && 
                   debouncedFormData.title.trim() && 
                   debouncedFormData.price.trim() && 
                   imageUrls.length > 0;

  const hasDraft = lastSaveTime !== null;

  return (
    <EnhancedErrorBoundary level="component">
      <div className="max-w-md mx-auto space-y-6">
        {/* Status indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Онлайн' : 'Офлайн режим'}
            </span>
          </div>
          
          {hasQueuedActions && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              В очереди: {queuedActions}
            </Badge>
          )}
          
          {hasDraft && (
            <Badge variant="outline" className="text-xs">
              <Save className="h-3 w-3 mr-1" />
              Автосохранено
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Добавление товара</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {translations.form.labels.title} *
                  </label>
                  <input
                    type="text"
                    value={displayData.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={translations.form.placeholders.title}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {translations.form.labels.price} *
                  </label>
                  <input
                    type="number"
                    value={displayData.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={translations.form.placeholders.price}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {translations.form.labels.description}
                  </label>
                  <textarea
                    value={displayData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                    placeholder={translations.form.placeholders.description}
                    maxLength={1000}
                  />
                </div>
              </div>

              <OptimizedMediaSection
                imageUrls={imageUrls}
                handleMobileOptimizedImageUpload={handleImageUpload}
                onImageDelete={handleImageDelete}
                onSetPrimaryImage={setPrimaryImage}
                primaryImage={primaryImage}
                onUploadStateChange={handleUploadStateChange}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!canSubmit}
              >
                {isCreating ? (
                  "Публикуем..."
                ) : isOnline ? (
                  "Опубликовать товар"
                ) : (
                  "Сохранить в очередь"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </EnhancedErrorBoundary>
  );
};

export default OptimizedFormWithAutosave;