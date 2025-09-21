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
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // Получаем переводы
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  
  // Объединенное состояние формы
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обновление полей формы
  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Состояния для изображений (НЕ МЕНЯЕМ)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState("");
  const [isMediaUploading, setIsMediaUploading] = useState(false);

  // Обработчики изображений (оставляем как есть)
  const handleImageUpload = (urls: string[]) => {
    console.log("📷 New images uploaded:", urls);
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
    
    if (!primaryImage && urls.length > 0) {
      setPrimaryImage(urls[0]);
    }
  };

  const handleImageDelete = (url: string) => {
    console.log("🗑️ Deleting image:", url);
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

  // Оптимизированная отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Быстрая валидация
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
      console.log('🚀 Creating product with RPC...', {
        title: formData.title,
        sellerId: user.id,
        imageCount: imageUrls.length,
        primaryImage
      });

      // Создаем товар атомарно через RPC функцию
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

      console.log('✅ Product created:', productId);

      // Массовая вставка изображений
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
      
      console.log(`✅ ${imageUrls.length} images added for product ${productId}`);

      // Уведомления для доверенных продавцов
      if (profile?.is_trusted_seller) {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: { productId }
          });
          console.log('✅ Notification sent');
        } catch (notificationError) {
          console.error('⚠️ Notification failed:', notificationError);
        }
      }

      const successMessage = profile?.is_trusted_seller 
        ? t.messages.productCreated
        : `${t.messages.productCreated}. ${t.sections.productDescription}`;

      toast({
        title: t.messages.productCreated,
        description: successMessage,
      });

      navigate(`/seller/product/${productId}`);
      
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
    <ProtectedRoute allowedRoles={['seller']}>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{t.sections.addProduct}</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Загрузка изображений - используем существующий компонент */}
              <OptimizedMediaSection
                imageUrls={imageUrls}
                handleMobileOptimizedImageUpload={handleImageUpload}
                primaryImage={primaryImage}
                onSetPrimaryImage={setPrimaryImage}
                onImageDelete={handleImageDelete}
                disabled={isSubmitting}
                onUploadStateChange={handleUploadStateChange}
              />
              
              {/* Название товара */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.labels.title} *
                </label>
                <textarea
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder={t.placeholders.title}
                  className="w-full p-3 border border-input rounded-lg bg-background h-24 resize-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Цена */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.labels.price} *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateForm('price', e.target.value)}
                  placeholder={t.placeholders.price}
                  className="w-full p-3 border border-input rounded-lg bg-background"
                  required
                  min={1}
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Описание (опционально) */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.labels.description} {t.optional}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder={t.placeholders.description}
                  className="w-full p-3 border border-input rounded-lg bg-background h-24 resize-none"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Кнопка отправки */}
              <Button
                type="submit"
                disabled={isSubmitting || isMediaUploading}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? t.buttons.publishing : t.buttons.publish}
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SellerAddProduct;