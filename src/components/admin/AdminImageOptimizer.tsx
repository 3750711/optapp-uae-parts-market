
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Image, CheckCircle, AlertTriangle, FileImage, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  title: string;
  seller_name: string;
  status: string;
  images: Array<{
    id: string;
    url: string;
    preview_url: string | null;
    is_primary: boolean;
  }>;
}

interface OptimizationResult {
  imageId: string;
  success: boolean;
  originalSize?: number;
  thumbnailSize?: number;
  compressionRatio?: number;
  quality?: number;
  previewUrl?: string;
  error?: string;
}

const AdminImageOptimizer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingImages, setProcessingImages] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<{ [key: string]: OptimizationResult }>({});

  // Загружаем все товары с изображениями
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          seller_name,
          status,
          product_images (
            id,
            url,
            preview_url,
            is_primary
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Фильтруем товары, у которых есть изображения
      const productsWithImages = data?.filter(product => 
        product.product_images && product.product_images.length > 0
      ) || [];

      setProducts(productsWithImages.map(p => ({
        ...p,
        images: p.product_images || []
      })));

    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Фильтрованные товары по поисковому запросу
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработка одного изображения
  const processImage = async (product: Product, image: any) => {
    const imageKey = `${product.id}-${image.id}`;
    setProcessingImages(prev => new Set(prev).add(imageKey));

    try {
      console.log(`Processing image ${image.id} for product ${product.id}`);

      // Вызываем Edge Function для создания превью
      const { data: response, error: fnError } = await supabase.functions.invoke('compress-catalog-thumbnails', {
        body: {
          imageUrl: image.url,
          productId: product.id,
          maxSizeKB: 25,
          thumbnailSize: 150
        }
      });

      if (fnError) {
        throw new Error(`Edge Function error: ${fnError.message}`);
      }

      if (response.success) {
        // Обновляем preview_url в базе данных
        const { error: updateError } = await supabase
          .from('product_images')
          .update({ preview_url: response.thumbnailUrl })
          .eq('id', image.id);

        if (updateError) {
          throw new Error(`Database update error: ${updateError.message}`);
        }

        const result: OptimizationResult = {
          imageId: image.id,
          success: true,
          originalSize: response.originalSize,
          thumbnailSize: response.thumbnailSize,
          compressionRatio: response.compressionRatio,
          quality: response.quality,
          previewUrl: response.thumbnailUrl
        };

        setResults(prev => ({ ...prev, [imageKey]: result }));

        // Обновляем локальное состояние продуктов
        setProducts(prev => prev.map(p => {
          if (p.id === product.id) {
            return {
              ...p,
              images: p.images.map(img => 
                img.id === image.id 
                  ? { ...img, preview_url: response.thumbnailUrl }
                  : img
              )
            };
          }
          return p;
        }));

        toast({
          title: 'Превью создано',
          description: `Размер: ${(response.originalSize / 1024).toFixed(1)}KB → ${(response.thumbnailSize / 1024).toFixed(1)}KB (сжатие ${response.compressionRatio}%)`,
        });

        console.log(`Successfully processed image ${image.id}`);
      } else {
        throw new Error(response.error || 'Unknown error');
      }

    } catch (error) {
      console.error(`Error processing image ${image.id}:`, error);
      
      const result: OptimizationResult = {
        imageId: image.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setResults(prev => ({ ...prev, [imageKey]: result }));

      toast({
        title: 'Ошибка обработки',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setProcessingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageKey);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getImageStats = (images: any[]) => {
    const total = images.length;
    const withPreviews = images.filter(img => img.preview_url).length;
    return { total, withPreviews, withoutPreviews: total - withPreviews };
  };

  const totalStats = products.reduce((acc, product) => {
    const stats = getImageStats(product.images);
    return {
      totalProducts: acc.totalProducts + 1,
      totalImages: acc.totalImages + stats.total,
      totalWithPreviews: acc.totalWithPreviews + stats.withPreviews,
      totalWithoutPreviews: acc.totalWithoutPreviews + stats.withoutPreviews
    };
  }, { totalProducts: 0, totalImages: 0, totalWithPreviews: 0, totalWithoutPreviews: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Оптимизация изображений</h1>
        <Button onClick={loadProducts} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Обновить список
        </Button>
      </div>

      {/* Статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Общая статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalStats.totalProducts}</div>
              <div className="text-sm text-gray-600">Товаров</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalStats.totalImages}</div>
              <div className="text-sm text-gray-600">Изображений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalStats.totalWithPreviews}</div>
              <div className="text-sm text-gray-600">С превью</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalStats.totalWithoutPreviews}</div>
              <div className="text-sm text-gray-600">Без превью</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Поиск */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск товаров</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск по названию товара или продавцу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Список товаров */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Товары не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const imageStats = getImageStats(product.images);
            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <CardDescription>
                        Продавец: {product.seller_name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {imageStats.total} изображений
                      </Badge>
                      <Badge variant={imageStats.withoutPreviews > 0 ? "destructive" : "default"}>
                        {imageStats.withPreviews}/{imageStats.total} с превью
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {product.images.map((image) => {
                      const imageKey = `${product.id}-${image.id}`;
                      const isProcessing = processingImages.has(imageKey);
                      const result = results[imageKey];
                      
                      return (
                        <div key={image.id} className="border rounded-lg p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {image.is_primary ? 'Основное' : 'Дополнительное'}
                              </span>
                            </div>
                            {image.preview_url ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>

                          <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                            <img
                              src={image.preview_url || image.url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          {!image.preview_url ? (
                            <Button
                              onClick={() => processImage(product, image)}
                              disabled={isProcessing}
                              size="sm"
                              className="w-full"
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Создание превью...
                                </>
                              ) : (
                                <>
                                  <Image className="mr-2 h-4 w-4" />
                                  Создать превью
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="text-xs text-green-600 text-center">
                              ✓ Превью создано
                            </div>
                          )}

                          {result && (
                            <div className={`text-xs p-2 rounded ${
                              result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                              {result.success ? (
                                <div>
                                  <div>Исходный: {result.originalSize ? formatFileSize(result.originalSize) : 'N/A'}</div>
                                  <div>Превью: {result.thumbnailSize ? formatFileSize(result.thumbnailSize) : 'N/A'}</div>
                                  <div>Сжатие: {result.compressionRatio}%</div>
                                </div>
                              ) : (
                                <div>Ошибка: {result.error}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminImageOptimizer;
