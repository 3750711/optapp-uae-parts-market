import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import OptimizedMediaSection from "@/components/product/form/OptimizedMediaSection";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { useSmartDebounce } from "@/hooks/useSmartDebounce";
import { useStandardSellerProductCreation } from "@/hooks/useStandardSellerProductCreation";
import { useBackgroundCacheWarming } from "@/hooks/useTrustedSellerPrefetch";
import { logger } from "@/utils/productionLogger";

const OptimizedStandardForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { createStandardSellerProduct, isCreating, currentUserProfile, isProfileLoading } = useStandardSellerProductCreation();
  
  // Background cache warming for better performance
  useBackgroundCacheWarming();
  
  // Memoized translations to prevent unnecessary recalculations
  const translations = useMemo(() => ({
    form: getFormTranslations(language),
    common: getCommonTranslations(language)
  }), [language]);
  
  const [displayData, setDisplayData] = useState({
    title: "",
    price: "",
    description: ""
  });
  
  // Smart debouncing with adaptive delays
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
  
  // Memoized form data to prevent unnecessary re-renders
  const formData = useMemo(() => ({
    title: debouncedTitle,
    price: debouncedPrice,
    description: debouncedDescription
  }), [debouncedTitle, debouncedPrice, debouncedDescription]);
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState("");
  const [isMediaUploading, setIsMediaUploading] = useState(false);

  const updateForm = (field: keyof typeof displayData, value: string) => {
    setDisplayData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    setImageUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete));
    
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

    if (!formData.title.trim()) {
      toast({
        title: translations.form.validation.titleRequired,
        variant: "destructive",
      });
      return;
    }

    if (!formData.price.trim()) {
      toast({
        title: translations.form.validation.priceRequired,
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseFloat(formData.price);
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

    try {
      logger.log("📤 Submitting standard seller product...");
      
      const product = await createStandardSellerProduct({
        title: formData.title.trim(),
        price: priceNum,
        description: formData.description?.trim() || '',
        imageUrls,
        primaryImage
      });

      if (product?.id) {
        toast({
          title: translations.form.messages.productCreated,
        });
        
        navigate(`/products/${product.id}`);
      }
    } catch (error) {
      logger.error("❌ Error creating product:", error);
      toast({
        title: "Ошибка при создании товара",
        description: error instanceof Error ? error.message : "Попробуйте еще раз",
        variant: "destructive",
      });
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных профиля...</p>
        </div>
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.user_type !== 'seller') {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Только продавцы могут создавать товары</p>
      </div>
    );
  }

  const canSubmit = !isCreating && !isMediaUploading && 
                   formData.title.trim() && 
                   formData.price.trim() && 
                   imageUrls.length > 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
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
          {isCreating ? "Публикуем..." : "Опубликовать товар"}
        </Button>
      </form>
    </div>
  );
};

export default OptimizedStandardForm;