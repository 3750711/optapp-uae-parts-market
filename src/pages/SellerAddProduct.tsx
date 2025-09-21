import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import OptimizedMediaSection from "@/components/product/form/OptimizedMediaSection";

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
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
        title: "Ошибка",
        description: "Введите название товара",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      toast({
        title: "Ошибка", 
        description: "Введите корректную цену",
        variant: "destructive",
      });
      return;
    }

    if (imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одно фото",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Ошибка",
        description: "Пользователь не авторизован",
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
        throw new Error(`Ошибка загрузки изображений: ${imageError.message}`);
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
        ? "Товар успешно опубликован"
        : "Товар отправлен на модерацию и будет опубликован после проверки";

      toast({
        title: "Товар создан",
        description: successMessage,
      });

      navigate(`/seller/product/${productId}`);
      
    } catch (error) {
      console.error("💥 Error creating product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать товар. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/seller/dashboard')}
          className="mb-4"
        >
          ← Назад к панели
        </Button>
        <h1 className="text-2xl font-bold">Добавить товар</h1>
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
            Название товара *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder="Введите название товара"
            className="w-full p-3 border border-input rounded-lg bg-background"
            required
            minLength={3}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Цена */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Цена *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => updateForm('price', e.target.value)}
            placeholder="Введите цену"
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
            Описание (необязательно)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateForm('description', e.target.value)}
            placeholder="Описание товара (необязательно)"
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
          {isSubmitting ? "Публикация..." : "Опубликовать товар"}
        </Button>
      </form>
    </div>
  );
};

export default SellerAddProduct;