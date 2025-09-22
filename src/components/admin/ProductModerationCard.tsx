import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SimpleTextInput } from '@/components/admin/SimpleTextInput';
import { SimpleNumberInput } from '@/components/admin/SimpleNumberInput';
import SimpleCarSelector from '@/components/ui/SimpleCarSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAllCarBrands } from '@/hooks/useAllCarBrands';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CheckCircle, Eye, Package, ChevronLeft, ChevronRight, ZoomIn, RotateCcw, Bot, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { adminProductsKeys } from '@/utils/cacheKeys';

interface Product {
  id: string;
  title: string;
  price: number;
  delivery_price?: number;
  place_number?: number;
  status: string;
  description?: string;
  product_images?: Array<{ url: string; is_primary?: boolean }>;
  seller_name: string;
  brand?: string;
  model?: string;
  ai_confidence?: number;
  ai_enriched_at?: string;
  ai_original_title?: string;
  created_at?: string;
}

interface ProductModerationCardProps {
  product: Product;
  onUpdate: () => void;
  statusFilter?: string;
  debouncedSearchTerm?: string;
  sellerFilter?: string;
  pageSize?: number;
}

const ProductModerationCard: React.FC<ProductModerationCardProps> = ({
  product,
  onUpdate,
  statusFilter = 'pending',
  debouncedSearchTerm = '',
  sellerFilter = 'all',
  pageSize = 12
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Локальное состояние формы
  const [formData, setFormData] = useState({
    title: product.title,
    price: product.price,
    place_number: product.place_number || 1,
    delivery_price: product.delivery_price || 0,
    brand: product.brand || '',
    model: product.model || ''
  });

  // Обновляем форму при изменении продукта
  useEffect(() => {
    setFormData({
      title: product.title,
      price: product.price,
      place_number: product.place_number || 1,
      delivery_price: product.delivery_price || 0,
      brand: product.brand || '',
      model: product.model || ''
    });
  }, [product]);
  
  // Мемоизация данных изображений
  const images = useMemo(() => product.product_images || [], [product.product_images]);
  const hasMultipleImages = images.length > 1;
  
  // Упрощенная навигация
  const navigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentImageIndex(prev => {
      if (direction === 'prev') return prev === 0 ? images.length - 1 : prev - 1;
      return prev === images.length - 1 ? 0 : prev + 1;
    });
  }, [images.length]);
  
  // Упрощенный swipe handler
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: () => navigate('next'),
    onSwipeRight: () => navigate('prev'),
    threshold: 50
  });
  
  const {
    brands,
    allModels,
    isLoading: isLoadingCarData,
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById
  } = useAllCarBrands();

  // Мутация для сохранения всех изменений
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', product.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data, updates) => {
      // Инвалидируем кеши для обновления
      queryClient.invalidateQueries({ 
        queryKey: adminProductsKeys.all
      });

      // Сохраняем данные для обучения AI если были изменения
      if (updates.title !== product.title || 
          updates.brand !== product.brand || 
          updates.model !== product.model) {
        
        supabase
          .from('ai_training_data')
          .insert({
            original_text: product.title,
            corrected_text: updates.title,
            brand_detected: updates.brand,
            model_detected: updates.model,
            moderator_corrections: {
              title: { from: product.title, to: updates.title },
              brand: { from: product.brand, to: updates.brand },
              model: { from: product.model, to: updates.model }
            }
          })
          .then(() => console.log('📚 Training data saved for AI learning'))
          .catch(err => console.warn('Warning: Could not save training data:', err));
      }
      
      toast({
        title: "Сохранено",
        description: "Изменения применены",
      });
    },
    onError: (err) => {
      console.error('❌ Error updating product:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    }
  });

  // Проверяем есть ли изменения
  const hasChanges = useMemo(() => {
    return formData.title !== product.title ||
           formData.price !== product.price ||
           formData.place_number !== (product.place_number || 1) ||
           formData.delivery_price !== (product.delivery_price || 0) ||
           formData.brand !== (product.brand || '') ||
           formData.model !== (product.model || '');
  }, [formData, product]);

  // Обработчики изменения полей
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
  };

  const handlePriceChange = (value: number) => {
    setFormData(prev => ({ ...prev, price: value }));
  };

  const handlePlaceNumberChange = (value: number) => {
    setFormData(prev => ({ ...prev, place_number: value }));
  };

  const handleDeliveryPriceChange = (value: number) => {
    setFormData(prev => ({ ...prev, delivery_price: value }));
  };

  const handleBrandChange = useCallback(async (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)?.name || '';
    setFormData(prev => ({ ...prev, brand, model: '' }));
  }, [brands]);

  const handleModelChange = useCallback(async (modelId: string) => {
    const model = allModels.find(m => m.id === modelId)?.name || '';
    setFormData(prev => ({ ...prev, model }));
  }, [allModels]);

  // Сброс изменений
  const handleReset = () => {
    setFormData({
      title: product.title,
      price: product.price,
      place_number: product.place_number || 1,
      delivery_price: product.delivery_price || 0,
      brand: product.brand || '',
      model: product.model || ''
    });
  };

  // AI обогащение товара
  const handleAiEnrich = async () => {
    if (isAiProcessing) return;
    
    setIsAiProcessing(true);
    setError(null);
    
    try {
      console.log('🤖 Starting AI enrichment for product:', product.id);
      
      const { data, error } = await supabase.functions.invoke('ai-enrich-product', {
        body: {
          product_id: product.id,
          title: formData.title || product.title,
          brand: formData.brand || product.brand,
          model: formData.model || product.model,
          description: product.description
        }
      });
      
      if (error) {
        console.error('AI enrichment error:', error);
        throw error;
      }

      if (data) {
        console.log('✨ AI enrichment completed:', data);
        
        // Обновляем локальное состояние с AI результатами
        if (data.corrected_title_ru && data.corrected_title_ru !== formData.title) {
          setFormData(prev => ({
            ...prev,
            title: data.corrected_title_ru
          }));
        }
        
        if (data.brand && data.brand !== formData.brand) {
          setFormData(prev => ({
            ...prev,
            brand: data.brand
          }));
        }
        
        if (data.model && data.model !== formData.model) {
          setFormData(prev => ({
            ...prev,
            model: data.model
          }));
        }
        
        // Показываем результат с confidence score
        const confidencePercent = Math.round(data.confidence * 100);
        const isHighConfidence = data.confidence >= 0.7;
        
        toast({
          title: `🤖 AI обработка завершена`,
          description: `Уверенность: ${confidencePercent}%. ${
            isHighConfidence ? 'Высокая точность!' : 'Требуется проверка модератора'
          }`,
          variant: isHighConfidence ? "default" : "destructive"
        });

        // Показываем исправления если есть
        if (data.corrections && data.corrections.length > 0) {
          console.log('📝 AI corrections:', data.corrections);
        }
      }
      
    } catch (error) {
      console.error('❌ AI enrichment failed:', error);
      setError('Ошибка AI обработки. Попробуйте позже.');
      
      toast({
        title: "Ошибка AI",
        description: "Не удалось обработать товар. Попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Публикация с сохранением всех изменений
  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const updates: any = { 
        status: 'active',
        ...formData
      };
      
      // Добавить оригинальное название если нужно
      if (!product.description?.includes('Оригинальное название')) {
        updates.description = `Оригинальное название от продавца: ${product.title}\n\n${product.description || ''}`;
      }
      
      await updateMutation.mutateAsync(updates);
      
      toast({ title: "Товар опубликован и изменения сохранены" });
    } finally {
      setIsPublishing(false);
    }
  };

  // Предзагрузка следующего изображения для плавности
  useEffect(() => {
    if (images.length > 1) {
      const nextIndex = (currentImageIndex + 1) % images.length;
      const img = new Image();
      img.src = images[nextIndex]?.url;
    }
  }, [currentImageIndex, images]);

  // Мемоизированный цвет статуса
  const statusColor = useMemo(() => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800',
      created: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800'
    };
    return colors[product.status] || 'bg-gray-100 text-gray-800';
  }, [product.status]);

  // Получаем ID для селектора машин
  const brandId = brands.find(b => b.name === formData.brand)?.id || '';
  const modelId = allModels.find(m => 
    m.brand_id === brandId && m.name === formData.model
  )?.id || '';

  // Проверяем есть ли AI данные
  const hasAiData = product.ai_confidence !== null && product.ai_enriched_at;
  const aiConfidencePercent = product.ai_confidence ? Math.round(product.ai_confidence * 100) : 0;
  const isHighAiConfidence = (product.ai_confidence || 0) >= 0.9;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div ref={swipeRef} className="relative h-48 bg-muted overflow-hidden">
        {images.length > 0 ? (
          <>
            <div className="relative w-full h-full group cursor-zoom-in" onClick={() => setFullscreenImage(images[currentImageIndex]?.url)}>
              <img
                src={images[currentImageIndex]?.url}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* Navigation Buttons - only show if multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={() => navigate('prev')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('next')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {images.length}
                </div>
                
                {/* Image Indicators */}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                      aria-label={`Перейти к фото ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-1 flex-col items-end">
          <Badge 
            className={statusColor}
            variant="outline"
          >
            {product.status}
          </Badge>
          {hasAiData && (
            <Badge 
              variant={isHighAiConfidence ? "default" : "outline"}
              className="gap-1 text-xs"
            >
              <Bot className="h-3 w-3" />
              AI {aiConfidencePercent}%
            </Badge>
          )}
        </div>

        {/* Индикатор изменений */}
        {hasChanges && (
          <Badge 
            className="absolute top-2 left-2 bg-primary text-primary-foreground"
            variant="default"
          >
            Изменено
          </Badge>
        )}
      </div>

      <CardContent className="p-6 space-y-6">
        {/* AI Enhancement Button */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiEnrich}
            disabled={isAiProcessing || isPublishing}
            className="gap-2"
          >
            {isAiProcessing ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isAiProcessing ? 'AI обработка...' : '🤖 AI обогащение'}
          </Button>
          
          {hasAiData && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
              <CheckCircle className="h-3 w-3 text-green-500" />
              AI обработан {new Date(product.ai_enriched_at || '').toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Название товара */}
        <SimpleTextInput
          label="Название товара"
          value={formData.title}
          originalValue={product.title}
          onChange={handleTitleChange}
          placeholder="Введите название товара"
        />

        {/* Цены в ряд */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SimpleNumberInput
            label="Цена товара"
            value={formData.price}
            originalValue={product.price}
            onChange={handlePriceChange}
            prefix="$"
          />
          
          <SimpleNumberInput
            label="Количество мест"
            value={formData.place_number}
            originalValue={product.place_number || 1}
            onChange={handlePlaceNumberChange}
            suffix=" шт"
            min={1}
          />
          
          <SimpleNumberInput
            label="Стоимость доставки"
            value={formData.delivery_price}
            originalValue={product.delivery_price || 0}
            onChange={handleDeliveryPriceChange}
            prefix="$"
          />
        </div>

        {/* Селектор машины */}
        <div className="pt-4 border-t">
          <SimpleCarSelector
            brandId={brandId}
            modelId={modelId}
            onBrandChange={handleBrandChange}
            onModelChange={handleModelChange}
            disabled={isLoadingCarData}
          />
          {(formData.brand !== (product.brand || '') || formData.model !== (product.model || '')) && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded border-l-2 border-muted-foreground/30">
              <span className="font-medium">Было:</span> {product.brand || 'Не указано'} {product.model || ''}
            </div>
          )}
        </div>

        {/* Информация о продавце */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <span className="font-medium">Продавец:</span> {product.seller_name}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => window.open(`/product/${product.id}`, '_blank')}
        >
          <Eye className="h-3 w-3 mr-1" />
          Просмотр
        </Button>

        {hasChanges && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Сбросить
          </Button>
        )}
        
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          size="sm"
          className="flex-1"
        >
          {isPublishing ? (
            <div className="animate-spin h-3 w-3 border-b-2 border-white mr-1" />
          ) : (
            <CheckCircle className="h-3 w-3 mr-1" />
          )}
          Опубликовать
        </Button>
      </CardFooter>

      {/* Полноэкранный просмотр изображений */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95" hideCloseButton>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={fullscreenImage || ''}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain cursor-zoom-out"
              onClick={() => setFullscreenImage(null)}
            />
            {/* Подсказка для закрытия */}
            <div className="absolute top-4 right-4 text-white/70 text-sm bg-black/50 px-3 py-1 rounded">
              Нажмите для закрытия
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductModerationCard;