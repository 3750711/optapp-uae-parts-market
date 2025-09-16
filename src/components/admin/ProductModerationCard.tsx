import React, { useState, useEffect } from 'react';
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
  // Filter parameters for cache key
  debouncedSearchTerm?: string;
  statusFilter?: string;
  sellerFilter?: string;
  pageSize?: number;
}

const ProductModerationCard: React.FC<ProductModerationCardProps> = ({
  product,
  onUpdate,
  debouncedSearchTerm = '',
  statusFilter = 'pending',
  sellerFilter = 'all',
  pageSize = 12
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [brandId, setBrandId] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [originalTitle] = useState<string>(product.title); // Store original title on component mount
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Image navigation logic
  const images = product.product_images || [];
  const hasMultipleImages = images.length > 1;
  
  const goToPrevious = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };
  
  const goToNext = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };
  
  // Setup swipe navigation
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
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

  // Initialize brand and model IDs from product data
  useEffect(() => {
    if (brands.length > 0 && product.brand) {
      const foundBrandId = findBrandIdByName(product.brand);
      if (foundBrandId) {
        setBrandId(foundBrandId);
        
        if (product.model && allModels.length > 0) {
          // Filter models by brand and then find the matching model
          const brandModels = allModels.filter(model => model.brand_id === foundBrandId);
          const foundModel = brandModels.find(model => 
            model.name.toLowerCase() === product.model?.toLowerCase()
          );
          if (foundModel) {
            setModelId(foundModel.id);
          }
        }
      }
    }
  }, [brands, allModels, product.brand, product.model, findBrandIdByName]);

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  // Create mutation for field updates with proper cache management
  const updateFieldMutation = useMutation({
    mutationFn: async ({ productId, field, value }: { 
      productId: string; 
      field: string; 
      value: string | number 
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ [field]: value })
        .eq('id', productId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onMutate: async ({ productId, field, value }) => {
      // Construct the proper cache key with filter parameters
      const cacheKey = ['admin-products', { debouncedSearchTerm, statusFilter, sellerFilter, pageSize }];
      
      // Cancel outgoing refetches to prevent optimistic update conflicts
      await queryClient.cancelQueries({ queryKey: cacheKey });
      
      // Save previous data for rollback
      const previousData = queryClient.getQueryData(cacheKey);
      
      // Optimistic update using correct data structure
      queryClient.setQueryData(cacheKey, (old: any) => {
        if (!old?.pages) return old;
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((p: any) => 
              p.id === productId 
                ? { ...p, [field]: value }
                : p
            )
          }))
        };
      });
      
      return { previousData, cacheKey };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData && context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousData);
      }
      
      console.error('Error updating product field:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables, context) => {
      // Update cache with server response
      if (context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((p: any) => 
                p.id === variables.productId ? data : p
              )
            }))
          };
        });
      }
    },
    onSettled: () => {
      // Invalidate to ensure synchronization with server
      const cacheKey = ['admin-products', { debouncedSearchTerm, statusFilter, sellerFilter, pageSize }];
      queryClient.invalidateQueries({ queryKey: cacheKey });
    }
  });

  const handleFieldUpdate = async (field: string, value: string | number) => {
    await updateFieldMutation.mutateAsync({ 
      productId: product.id, 
      field, 
      value 
    });
  };

  const handleBrandChange = async (selectedBrandId: string, brandName: string) => {
    setBrandId(selectedBrandId);
    setModelId(''); // Reset model when brand changes
    
    try {
      await handleFieldUpdate('brand', brandName);
      await handleFieldUpdate('model', ''); // Clear model in database
    } catch (error) {
      console.error('Error updating brand:', error);
    }
  };

  const handleModelChange = async (selectedModelId: string, modelName: string) => {
    setModelId(selectedModelId);
    
    try {
      await handleFieldUpdate('model', modelName);
    } catch (error) {
      console.error('Error updating model:', error);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Check if original title is already in description
      const originalTitlePrefix = "Оригинальное название от продавца:";
      const currentDescription = product.description || "";
      let updatedDescription = currentDescription;
      
      if (!currentDescription.includes(originalTitlePrefix)) {
        // Add original title to description
        const originalTitleText = `${originalTitlePrefix} ${originalTitle}`;
        updatedDescription = currentDescription 
          ? `${originalTitleText}\n\n${currentDescription}`
          : originalTitleText;
      }

      const { error } = await supabase
        .from('products')
        .update({ 
          status: 'active',
          description: updatedDescription
        })
        .eq('id', product.id);

      if (error) throw error;

      // Invalidate cache to refresh data using proper cache key
      const cacheKey = ['admin-products', { debouncedSearchTerm, statusFilter, sellerFilter, pageSize }];
      await queryClient.invalidateQueries({ queryKey: cacheKey });

      toast({
        title: "Товар опубликован",
        description: "Товар успешно опубликован",
      });

      onUpdate();
    } catch (error) {
      console.error('Error publishing product:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать товар",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'created':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div ref={swipeRef} className="relative h-48 bg-muted overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]?.url}
              alt={product.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
            
            {/* Navigation Buttons - only show if multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  aria-label="Следующее фото"
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
          className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}
          variant="outline"
        >
          {product.status}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Название
          </label>
          <AdminTitleEditor
            originalTitle={originalTitle}
            value={product.title}
            onSave={(value) => handleFieldUpdate('title', value)}
            placeholder="Введите новое название товара"
            className="mt-1"
          />
        </div>

        {/* Price and Details - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Цена
            </label>
            <InlineNumberField
              value={product.price}
              onSave={(value) => handleFieldUpdate('price', value)}
              prefix="$"
              step={0.01}
              min={0}
              max={99999}
              className="mt-1"
              displayClassName="text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Места
            </label>
            <InlineNumberField
              value={product.place_number || 1}
              onSave={(value) => handleFieldUpdate('place_number', value)}
              suffix=" шт"
              step={1}
              min={1}
              max={100}
              className="mt-1"
              displayClassName="text-sm font-medium"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Доставка
            </label>
            <InlineNumberField
              value={product.delivery_price || 0}
              onSave={(value) => handleFieldUpdate('delivery_price', value)}
              prefix="$"
              step={0.01}
              min={0}
              max={9999}
              className="mt-1"
              displayClassName="text-sm font-medium"
            />
          </div>
        </div>

        {/* Car Brand and Model */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Автомобиль
          </label>
          <SimpleCarSelector
            brandId={brandId}
            modelId={modelId}
            onBrandChange={handleBrandChange}
            onModelChange={handleModelChange}
            disabled={isLoadingCarData}
            isMobile={true}
          />
        </div>

        {/* Seller Information */}
        <div className="text-xs text-muted-foreground">
          <div className="font-medium">Продавец: {product.seller_name}</div>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:flex-1 text-xs py-2"
            onClick={() => window.open(`/product/${product.id}`, '_blank')}
          >
            <Eye className="h-3 w-3 mr-1" />
            Предпросмотр
          </Button>
          
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="w-full sm:flex-1 text-xs py-2"
          >
            {isPublishing ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
            ) : (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            Опубликовать
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductModerationCard;