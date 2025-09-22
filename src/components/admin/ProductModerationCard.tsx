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
import { useLazyCarData } from '@/hooks/useLazyCarData';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CheckCircle, Eye, Package, ChevronLeft, ChevronRight, ZoomIn, RotateCcw, Bot, Sparkles, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { adminProductsKeys } from '@/utils/cacheKeys';
import { AIConfidenceIndicator } from '@/components/ai/AIConfidenceIndicator';
import { AIDeliverySuggestions } from '@/components/admin/AIDeliverySuggestions';


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
  ai_suggested_title?: string;
  ai_suggested_brand?: string;
  ai_suggested_model?: string;
  // Новые поля для AI-анализа доставки
  ai_suggested_delivery_prices?: number[];
  ai_delivery_confidence?: number;
  ai_delivery_reasoning?: {
    matches_found: number;
    search_queries: string[];
    price_distribution: Record<string, number>;
    top_confidence: number;
    logic_type: string;
    similar_products: Array<{id: string, title: string, price: number}>;
    execution_time_ms: number;
    analysis_summary: string;
  };
  created_at?: string;
}

interface ProductModerationCardProps {
  product: Product;
  onUpdate: () => void;
  statusFilter?: string;
  debouncedSearchTerm?: string;
  sellerFilter?: string;
  pageSize?: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

const ProductModerationCard: React.FC<ProductModerationCardProps> = ({
  product,
  onUpdate,
  statusFilter = 'pending',
  debouncedSearchTerm = '',
  sellerFilter = 'all',
  pageSize = 12,
  onNext,
  onPrevious
}) => {
  // Диагностические логи для отладки
  console.log('🎯 ProductModerationCard рендерится:', {
    productId: product.id,
    productTitle: product.title,
    productBrand: product.brand,
    productModel: product.model
  });

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

  // Состояние для AI предложений
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);

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
    models,
    isLoadingBrands,
    isLoadingModels,
    selectedBrandId,
    enableBrandsLoading,
    selectBrand,
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById,
    findModelIdByNameDirect
  } = useLazyCarData();

  const isLoadingCarData = isLoadingBrands || isLoadingModels;

  // Инициализация ленивой загрузки данных
  useEffect(() => {
    enableBrandsLoading();
    
    // Если есть бренд в данных товара, загружаем его модели
    if (product.brand && brands.length > 0) {
      const brandId = brands.find(b => b.name === product.brand)?.id;
      if (brandId && selectedBrandId !== brandId) {
        selectBrand(brandId);
      }
    }
  }, [enableBrandsLoading, selectBrand, product.brand, brands, selectedBrandId]);

  // Диагностические логи для данных автомобилей
  console.log('🚗 Car Data State:', {
    isLoadingCarData,
    isLoadingBrands,
    isLoadingModels,
    brandsCount: brands.length,
    modelsCount: models.length,
    selectedBrandId,
    formDataBrand: formData.brand,
    formDataModel: formData.model,
    productBrand: product.brand,
    productModel: product.model
  });

  // Дополнительная диагностика для Toyota
  if (formData.brand === 'Toyota' || product.brand === 'Toyota') {
    console.log('🏗️ Toyota Models Debug:', {
      selectedBrandId,
      modelsCount: models.length,
      spacioModels: models.filter(m => m.name.toLowerCase().includes('spacio')),
      allModels: models.map(m => m.name).sort()
    });
  }

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
    
    // Загружаем модели для выбранного бренда
    selectBrand(brandId);
  }, [brands, selectBrand]);

  const handleModelChange = useCallback(async (modelId: string) => {
    const model = models.find(m => m.id === modelId)?.name || '';
    setFormData(prev => ({ ...prev, model }));
  }, [models]);

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

  // Функции частичного применения AI предложений
  const handleApplyAiTitle = async () => {
    if (!product.ai_suggested_title) return;
    
    // Перемещаем оригинальное название в описание
    const originalTitle = product.ai_original_title || product.title;
    const currentDescription = product.description || '';
    
    let updatedDescription = currentDescription;
    if (!currentDescription.includes(originalTitle)) {
      updatedDescription = currentDescription 
        ? `Оригинальное название от продавца: ${originalTitle}\n\n${currentDescription}`
        : `Оригинальное название от продавца: ${originalTitle}`;
    }
    
    // Применяем AI название
    setFormData(prev => ({ ...prev, title: product.ai_suggested_title! }));
    
    // Сохраняем в базу
    try {
      await updateMutation.mutateAsync({
        title: product.ai_suggested_title,
        description: updatedDescription
      });
      
      toast({
        title: "Название применено",
        description: "AI предложение для названия применено",
      });
    } catch (error) {
      console.error('Error applying AI title:', error);
    }
  };

  const handleApplyAiBrand = async () => {
    if (!product.ai_suggested_brand) return;
    
    // Находим ID бренда по названию
    const foundBrandId = findBrandIdByName(product.ai_suggested_brand);
    
    if (!foundBrandId) {
      toast({
        title: "Марка не найдена",
        description: `Марка "${product.ai_suggested_brand}" не найдена в базе данных`,
        variant: "destructive"
      });
      return;
    }
    
    // Обновляем форму (сбрасываем модель при смене марки)
    setFormData(prev => ({ ...prev, brand: product.ai_suggested_brand!, model: '' }));
    
    try {
      await updateMutation.mutateAsync({
        brand: product.ai_suggested_brand,
        model: null
      });
      
      toast({
        title: "Марка применена",
        description: "AI предложение для марки применено",
      });
    } catch (error) {
      console.error('Error applying AI brand:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось применить марку",
        variant: "destructive"
      });
    }
  };

  const handleApplyAiModel = async () => {
    if (!product.ai_suggested_model) return;
    
    // Сначала нужно определить текущий бренд (из AI предложения или текущего значения формы)
    const currentBrand = formData.brand;
    const currentBrandId = findBrandIdByName(currentBrand);
    
    if (!currentBrandId) {
      toast({
        title: "Сначала выберите марку",
        description: "Для применения модели необходимо сначала выбрать марку",
        variant: "destructive"
      });
      return;
    }
    
    // Ищем модель для текущего бренда (прямой поиск в базе)
    const foundModelId = await findModelIdByNameDirect(product.ai_suggested_model!, currentBrandId);
    
    if (!foundModelId) {
      toast({
        title: "Модель не найдена",
        description: `Модель "${product.ai_suggested_model}" не найдена для марки "${currentBrand}"`,
        variant: "destructive"
      });
      return;
    }
    
    // Обновляем форму
    setFormData(prev => ({ ...prev, model: product.ai_suggested_model! }));
    
    try {
      await updateMutation.mutateAsync({
        model: product.ai_suggested_model
      });
      
      toast({
        title: "Модель применена", 
        description: "AI предложение для модели применено",
      });
    } catch (error) {
      console.error('Error applying AI model:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось применить модель",
        variant: "destructive"
      });
    }
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
      
      // ВСЕГДА сохраняем обучающие данные если был AI
      if (product.ai_confidence && product.ai_suggested_title) {
        const correctionData = {
          product_id: product.id,
          moderator_id: undefined, // Будет заполнено триггером auth.uid()
          ai_original_title: product.ai_original_title || product.title,
          ai_suggested_title: product.ai_suggested_title,
          ai_suggested_brand: product.ai_suggested_brand,
          ai_suggested_model: product.ai_suggested_model,
          moderator_corrected_title: formData.title,
          moderator_corrected_brand: formData.brand || null,
          moderator_corrected_model: formData.model || null,
          ai_confidence: product.ai_confidence,
          correction_type: formData.title === product.ai_suggested_title ? 'accepted' : 
                          (formData.title !== (product.ai_original_title || product.title) ? 'modified' : 'rejected'),
          was_ai_accepted: formData.title === product.ai_suggested_title
        };
        
        console.log('📚 Saving training data:', correctionData);
        
        await supabase
          .from('ai_moderation_corrections')
          .insert(correctionData);
        
        console.log('📚 Training data saved successfully');
        
        // ШАГ 2: Анализ различий между AI предложением и исправлением модератора
        if (product.ai_suggested_title && formData.title && product.ai_suggested_title !== formData.title) {
          try {
            console.log('🎯 Analyzing moderator corrections for rule extraction...');
            const { error: rulesError } = await supabase.functions.invoke('ai-enrich-product', {
              body: {
                extract_rules_only: true,
                ai_suggestion: product.ai_suggested_title,
                moderator_correction: formData.title,
                product_id: product.id
              }
            });
            
            if (rulesError) {
              console.warn('⚠️ Failed to extract rules from corrections:', rulesError);
            } else {
              console.log('📚 Rules extracted from moderator corrections');
            }
          } catch (error) {
            console.warn('⚠️ Rule extraction from corrections failed:', error);
          }
        }
      }
      
      await updateMutation.mutateAsync(updates);
      
      toast({ title: "Товар опубликован" });
    } catch (error) {
      console.error('Error in handlePublish:', error);
      toast({ 
        title: "Ошибка при публикации", 
        description: "Попробуйте снова", 
        variant: "destructive" 
      });
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

  // Получаем ID для селектора машин с отладочной информацией
  const brandId = React.useMemo(() => {
    const foundId = brands.find(b => b.name === formData.brand)?.id || '';
    console.log('🔍 Brand ID Search:', {
      searchTerm: formData.brand,
      foundId,
      availableBrands: brands.map(b => ({ id: b.id, name: b.name })),
      isLoadingCarData
    });
    return foundId;
  }, [formData.brand, brands, isLoadingCarData]);

  const modelId = React.useMemo(() => {
    if (!brandId) {
      console.log('🔍 Model ID Search: No brandId, skipping model search');
      return '';
    }
    
    const foundId = models.find(m => 
      m.brand_id === brandId && m.name === formData.model
    )?.id || '';
    
    console.log('🔍 Model ID Search:', {
      searchTerm: formData.model,
      brandId,
      brandName: formData.brand,
      foundId,
      availableModelsForBrand: models.map(m => ({ id: m.id, name: m.name })),
      modelsCount: models.length,
      selectedBrandId,
      isLoadingCarData
    });
    
    return foundId;
  }, [formData.model, brandId, formData.brand, models, selectedBrandId, isLoadingCarData]);

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
          <AIConfidenceIndicator
            confidence={product.ai_confidence}
            enrichedAt={product.ai_enriched_at}
            isProcessing={isAiProcessing}
            className="items-end"
          />
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
        {/* AI Suggestions Comparison Block */}
        {product.ai_suggested_title && (
          <Card className="border-blue-200 bg-blue-50/50">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">AI предложения ({Math.round((product.ai_confidence || 0) * 100)}%)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground mb-1">Оригинал продавца:</div>
                  <div className="p-2 bg-white rounded border">
                    {product.ai_original_title || product.title}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground mb-1">AI предложение:</div>
                  <div 
                    className="p-2 bg-green-50 rounded border border-green-200 cursor-pointer hover:bg-green-100 transition-colors group relative"
                    onClick={handleApplyAiTitle}
                    title="Нажмите чтобы применить только название"
                  >
                    <div className="flex items-center justify-between">
                      <span>{product.ai_suggested_title}</span>
                      <ArrowRight className="h-3 w-3 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
              
              {product.ai_suggested_brand && (
                <div className="flex gap-2 mt-3 text-sm">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={handleApplyAiBrand}
                    title="Нажмите чтобы применить только марку"
                  >
                    Марка: {product.ai_suggested_brand} <ArrowRight className="h-3 w-3 ml-1 inline" />
                  </Badge>
                  {product.ai_suggested_model && (
                    <Badge 
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={handleApplyAiModel}
                      title="Нажмите чтобы применить только модель"
                    >
                      Модель: {product.ai_suggested_model} <ArrowRight className="h-3 w-3 ml-1 inline" />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
        {/* Form Fields */}

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
          
        </div>

        {/* AI анализ доставки */}
        <AIDeliverySuggestions
          suggestedPrices={product.ai_suggested_delivery_prices}
          deliveryConfidence={product.ai_delivery_confidence}
          reasoning={product.ai_delivery_reasoning}
          currentDeliveryPrice={formData.delivery_price}
          onAcceptPrice={(price) => {
            setFormData(prev => ({ ...prev, delivery_price: price }));
            toast({
              title: "Цена применена",
              description: `Установлена доставка: $${price}`,
              variant: "default"
            });
          }}
          onManualPriceChange={(price) => {
            setFormData(prev => ({ ...prev, delivery_price: price }));
          }}
          onRejectSuggestions={() => {
            console.log('AI delivery suggestions hidden');
          }}
        />

        {/* Селектор машины */}
        <div className="pt-4 border-t">
          <SimpleCarSelector
            brandId={brandId}
            modelId={modelId}
            onBrandChange={handleBrandChange}
            onModelChange={handleModelChange}
            disabled={isLoadingCarData}
            brands={brands}
            models={models}
            isLoadingBrands={isLoadingBrands}
            isLoadingModels={isLoadingModels}
            enableBrandsLoading={enableBrandsLoading}
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