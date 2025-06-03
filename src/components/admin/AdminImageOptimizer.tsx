
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Image, CheckCircle, AlertTriangle, FileImage } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  format?: string;
  error?: string;
}

const AdminImageOptimizer: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<OptimizationResult[]>([]);

  // Загружаем товары без превью
  const loadProductsWithoutPreviews = async () => {
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
        .limit(50);

      if (error) throw error;

      // Фильтруем товары, у которых есть изображения без превью
      const productsWithoutPreviews = data?.filter(product => 
        product.product_images && 
        product.product_images.length > 0 &&
        product.product_images.some(img => !img.preview_url)
      ) || [];

      setProducts(productsWithoutPreviews.map(p => ({
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
    loadProductsWithoutPreviews();
  }, []);

  // Фильтрованные товары по поисковому запросу
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработка изображений выбранного товара
  const processSelectedProduct = async () => {
    if (!selectedProduct) {
      toast({
        title: 'Ошибка',
        description: 'Выберите товар для обработки',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setIsProcessing(true);
    setResults([]);

    const imagesWithoutPreviews = product.images.filter(img => !img.preview_url);
    
    toast({
      title: 'Начинаем обработку',
      description: `Обрабатываем ${imagesWithoutPreviews.length} изображений для товара "${product.title}"`,
    });

    const processingResults: OptimizationResult[] = [];

    for (const image of imagesWithoutPreviews) {
      try {
        console.log(`Processing image ${image.id} for product ${product.id}`);

        // Вызываем Edge Function для создания превью
        const { data: response, error: fnError } = await supabase.functions.invoke('compress-catalog-thumbnails', {
          body: {
            imageUrl: image.url,
            productId: product.id,
            maxSizeKB: 20,
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

          processingResults.push({
            imageId: image.id,
            success: true,
            originalSize: response.originalSize,
            thumbnailSize: response.thumbnailSize,
            compressionRatio: response.compressionRatio,
            quality: response.quality,
            format: response.format
          });

          console.log(`Successfully processed image ${image.id}`);
        } else {
          throw new Error(response.error || 'Unknown error');
        }

      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        processingResults.push({
          imageId: image.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Обновляем has_preview флаг для товара
    const successfulPreviews = processingResults.filter(r => r.success).length;
    if (successfulPreviews > 0) {
      await supabase
        .from('products')
        .update({ has_preview: true })
        .eq('id', selectedProduct);
    }

    setResults(processingResults);
    setIsProcessing(false);

    const successCount = processingResults.filter(r => r.success).length;
    const totalCount = processingResults.length;

    toast({
      title: 'Обработка завершена',
      description: `Успешно обработано ${successCount} из ${totalCount} изображений`,
      variant: successCount === totalCount ? 'default' : 'destructive',
    });

    // Перезагружаем список товаров
    loadProductsWithoutPreviews();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Оптимизация изображений</h1>
        <Button onClick={loadProductsWithoutPreviews} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Обновить список
        </Button>
      </div>

      {/* Поиск товаров */}
      <Card>
        <CardHeader>
          <CardTitle>Выбор товара для обработки</CardTitle>
          <CardDescription>
            Выберите товар, изображения которого нужно оптимизировать
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search">Поиск по названию товара или продавцу</Label>
            <Input
              id="search"
              placeholder="Введите название товара или имя продавца..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="product-select">Товар</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите товар" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map((product) => {
                  const imagesWithoutPreviews = product.images.filter(img => !img.preview_url).length;
                  return (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate max-w-[300px]">
                          {product.title} - {product.seller_name}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {imagesWithoutPreviews} изображений
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedProductData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Изображения для обработки:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedProductData.images.map((image) => (
                  <div key={image.id} className="flex items-center space-x-2 text-sm">
                    <FileImage className="h-4 w-4" />
                    <span className="truncate flex-1">
                      Изображение {image.is_primary ? '(основное)' : ''}
                    </span>
                    {image.preview_url ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={processSelectedProduct}
            disabled={!selectedProduct || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка изображений...
              </>
            ) : (
              <>
                <Image className="mr-2 h-4 w-4" />
                Создать превью (WebP)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Результаты обработки */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты обработки</CardTitle>
            <CardDescription>
              Детальная информация о созданных превью
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={result.imageId}
                  className={`p-4 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        Изображение {index + 1}
                      </span>
                    </div>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Успешно' : 'Ошибка'}
                    </Badge>
                  </div>

                  {result.success && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Исходный размер:</span>
                        <div className="font-medium">
                          {result.originalSize ? formatFileSize(result.originalSize) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Размер превью:</span>
                        <div className="font-medium text-green-600">
                          {result.thumbnailSize ? formatFileSize(result.thumbnailSize) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Сжатие:</span>
                        <div className="font-medium">
                          {result.compressionRatio}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Формат:</span>
                        <div className="font-medium">
                          {result.format?.toUpperCase() || 'WebP'}
                        </div>
                      </div>
                    </div>
                  )}

                  {!result.success && result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      <span className="font-medium">Ошибка:</span> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-gray-600">Товаров требуют обработки</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {products.reduce((acc, p) => acc + p.images.filter(img => !img.preview_url).length, 0)}
              </div>
              <div className="text-sm text-gray-600">Изображений без превью</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.success).length}
              </div>
              <div className="text-sm text-gray-600">Успешно обработано в сессии</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImageOptimizer;
