import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { InlineEditableField } from '@/components/ui/InlineEditableField';
import { InlineNumberField } from '@/components/admin/InlineNumberField';
import AdminTitleEditor from '@/components/admin/AdminTitleEditor';
import SimpleCarSelector from '@/components/ui/SimpleCarSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAllCarBrands } from '@/hooks/useAllCarBrands';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { CheckCircle, Eye, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

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
}

interface ProductModerationCardProps {
  product: Product;
  onUpdate: () => void;
  statusFilter?: string;
}

const ProductModerationCard: React.FC<ProductModerationCardProps> = ({
  product,
  onUpdate,
  statusFilter = 'pending'
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [carSelection, setCarSelection] = useState({ brandId: '', modelId: '' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Инициализация car selection при изменении данных
  useEffect(() => {
    if (!brands.length || !product.brand) return;
    
    const brandId = brands.find(b => b.name === product.brand)?.id || '';
    const modelId = allModels.find(m => 
      m.brand_id === brandId && m.name === product.model
    )?.id || '';
    
    setCarSelection({ brandId, modelId });
  }, [brands, allModels, product.brand, product.model]);

  // Универсальная мутация
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
    onMutate: async (updates) => {
      const cacheKey = ['admin-products', statusFilter];
      await queryClient.cancelQueries({ queryKey: cacheKey });
      
      const previousData = queryClient.getQueryData(cacheKey);
      
      // Оптимистичное обновление
      queryClient.setQueryData(cacheKey, (old: any) => {
        if (!old?.pages) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((p: any) => 
              p.id === product.id ? { ...p, ...updates } : p
            )
          }))
        };
      });
      
      return { previousData };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['admin-products', statusFilter], context.previousData);
      }
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    }
  });

  // Debounced field updates для производительности
  const handleFieldUpdate = useCallback(async (field: string, value: any) => {
    // Используем setTimeout для debounce
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        updateMutation.mutate({ [field]: value });
        resolve();
      }, 300);
    });
  }, [updateMutation]);

  // Мемоизированные обработчики car selection
  const handleBrandChange = useCallback(async (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)?.name || '';
    setCarSelection({ brandId, modelId: '' });
    updateMutation.mutate({ brand, model: '' });
  }, [brands, updateMutation]);

  const handleModelChange = useCallback(async (modelId: string) => {
    const model = allModels.find(m => m.id === modelId)?.name || '';
    setCarSelection(prev => ({ ...prev, modelId }));
    updateMutation.mutate({ model });
  }, [allModels, updateMutation]);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const updates: any = { status: 'active' };
      
      // Добавить оригинальное название если нужно
      if (!product.description?.includes('Оригинальное название')) {
        updates.description = `Оригинальное название от продавца: ${product.title}\n\n${product.description || ''}`;
      }
      
      await updateMutation.mutateAsync(updates);
      
      toast({ title: "Товар опубликован" });
      onUpdate();
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div ref={swipeRef} className="relative h-48 bg-muted overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]?.url}
              alt={product.title}
              className="w-full h-full object-cover transition-all duration-300"
              loading="lazy"
              decoding="async"
            />
            
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
        
        <Badge 
          className={`absolute top-2 right-2 ${statusColor}`}
          variant="outline"
        >
          {product.status}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Название */}
        <AdminTitleEditor
          originalTitle={product.title}
          value={product.title}
          onSave={(value) => handleFieldUpdate('title', value)}
          className="w-full"
        />

        {/* Цены - упрощенная сетка */}
        <div className="grid grid-cols-3 gap-3">
          <InlineNumberField
            label="Цена"
            value={product.price}
            onSave={(value) => handleFieldUpdate('price', value)}
            prefix="$"
          />
          <InlineNumberField
            label="Места"
            value={product.place_number || 1}
            onSave={(value) => handleFieldUpdate('place_number', value)}
            suffix=" шт"
          />
          <InlineNumberField
            label="Доставка"
            value={product.delivery_price || 0}
            onSave={(value) => handleFieldUpdate('delivery_price', value)}
            prefix="$"
          />
        </div>

        {/* Селектор машины */}
        <SimpleCarSelector
          brandId={carSelection.brandId}
          modelId={carSelection.modelId}
          onBrandChange={handleBrandChange}
          onModelChange={handleModelChange}
          disabled={isLoadingCarData}
        />

        <div className="text-xs text-muted-foreground">
          Продавец: {product.seller_name}
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
    </Card>
  );
};

export default ProductModerationCard;