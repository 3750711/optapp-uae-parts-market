import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import OptimizedMediaSection from "@/components/product/form/OptimizedMediaSection";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { useDebounce } from "@/hooks/useDebounce";
import { useStandardSellerProductCreation } from "@/hooks/useStandardSellerProductCreation";
import { logger } from "@/utils/logger";

const StandardSellerForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { createStandardSellerProduct, isCreating, currentUserProfile, isProfileLoading } = useStandardSellerProductCreation();
  
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

  const handleImageUpload = (urls: string[]) => {
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const handleImageDelete = (url: string) => {
    const newImageUrls = imageUrls.filter(item => item !== url);
    setImageUrls(newImageUrls);
    
    if (primaryImage === url) {
      if (newImageUrls.length > 0) {
        setPrimaryImage(newImageUrls[0]);
      } else {
        setPrimaryImage("");
      }
    }
  };

  const handleUploadStateChange = (uploading: boolean) => {
    setIsMediaUploading(uploading);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.log('📝 Standard seller form submission started');
    
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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <OptimizedMediaSection
        imageUrls={imageUrls}
        handleMobileOptimizedImageUpload={handleImageUpload}
        primaryImage={primaryImage}
        onSetPrimaryImage={setPrimaryImage}
        onImageDelete={handleImageDelete}
        disabled={isSubmitting}
        onUploadStateChange={handleUploadStateChange}
      />
      
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
        <div className="text-center py-4">
          <p className="text-muted-foreground">Загрузка данных профиля...</p>
        </div>
      )}
      
      {!isProfileLoading && !currentUserProfile && (
        <div className="text-center py-4">
          <p className="text-destructive">Не удалось загрузить данные профиля. Обновите страницу.</p>
        </div>
      )}
      
      <Button
        type="submit"
        disabled={isCreating || isMediaUploading || isProfileLoading || !currentUserProfile}
        className="w-full"
        size="lg"
      >
        {isCreating ? t.buttons.publishing : t.buttons.publish}
      </Button>
    </form>
  );
};

export default StandardSellerForm;