import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import OptimizedMediaSection from "@/components/product/form/OptimizedMediaSection";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { useDebounce } from "@/hooks/useDebounce";

const StandardSellerForm = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (!user?.id) {
      toast({
        title: c.errors.title,
        description: c.errors.accessDenied,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: productId, error: productError } = await supabase
        .rpc('create_product_with_images', {
          p_title: formData.title.trim(),
          p_price: Number(formData.price),
          p_description: formData.description.trim() || null
        });

      if (productError) {
        console.error("❌ Error creating product:", productError);
        throw productError;
      }

      const imageInserts = imageUrls.map(url => ({
        product_id: productId,
        url: url,
        is_primary: url === primaryImage
      }));
      
      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageInserts);
        
      if (imageError) {
        console.error('❌ Error adding images:', imageError);
        throw new Error(`${c.messages.error}: ${imageError.message}`);
      }

      toast({
        title: t.messages.productCreated,
        description: `${t.messages.productCreated}. ${t.sections.productDescription}`,
      });

      navigate(`/seller/product/${productId}?from=add`);
      
    } catch (error) {
      console.error("💥 Error creating product:", error);
      toast({
        title: c.errors.title,
        description: c.messages.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      
      <Button
        type="submit"
        disabled={isSubmitting || isMediaUploading}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? t.buttons.publishing : t.buttons.publish}
      </Button>
    </form>
  );
};

export default StandardSellerForm;