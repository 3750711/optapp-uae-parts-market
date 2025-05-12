
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Image, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

const AdminImageOptimizer: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withPreviews: 0,
    withoutPreviews: 0,
    processed: 0,
    success: 0,
  });
  const [progress, setProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(20);
  const [productId, setProductId] = useState('');

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get total image count
      const { count: total } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true });
      
      // Get images with previews
      const { count: withPreviews } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .not('preview_url', 'is', null);
      
      // Images without previews
      const withoutPreviews = (total || 0) - (withPreviews || 0);
      
      setStats({
        ...stats,
        total: total || 0,
        withPreviews: withPreviews || 0,
        withoutPreviews: withoutPreviews || 0,
      });
      
      // Calculate progress
      const calculatedProgress = total ? Math.round((withPreviews / total) * 100) : 0;
      setProgress(calculatedProgress);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику изображений",
        variant: "destructive",
      });
    }
  };
  
  const processBatch = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { action: 'process_batch', batchSize },
      });
      
      if (error) throw error;
      
      setStats(prev => ({
        ...prev,
        withPreviews: prev.withPreviews + data.success,
        withoutPreviews: prev.withoutPreviews - data.processed,
        processed: prev.processed + data.processed,
        success: prev.success + data.success,
      }));
      
      // Update progress
      const newProgress = stats.total ? Math.round(((stats.withPreviews + data.success) / stats.total) * 100) : 0;
      setProgress(newProgress);
      
      toast({
        title: "Обработка завершена",
        description: `Обработано ${data.processed} изображений, успешно создано ${data.success} превью`,
      });
      
      // If there are more images, offer to continue
      if (data.remaining > 0) {
        const shouldContinue = window.confirm(`Осталось обработать ${data.remaining} изображений. Продолжить?`);
        if (shouldContinue) {
          // Small delay to allow UI to update
          setTimeout(() => processBatch(), 500);
          return;
        }
      }
      
      // Refresh stats after batch processing
      loadStats();
    } catch (error) {
      console.error('Error processing batch:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка при обработке изображений",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processProduct = async () => {
    if (!productId || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { action: 'process_product', productId },
      });
      
      if (error) throw error;
      
      toast({
        title: "Обработка завершена",
        description: `Обработано ${data.processed} изображений для продукта, успешно создано ${data.successCount} превью`,
      });
      
      // Refresh stats after processing
      loadStats();
    } catch (error) {
      console.error('Error processing product:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка при обработке изображений продукта",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const regeneratePreviews = async () => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      // Перегенерировать превью-изображения, включая уже существующие
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { 
          action: 'regenerate_previews', 
          limit: batchSize,
          // Можно добавить productIds если хотим обновить только конкретные товары
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Перегенерация превью завершена",
        description: `Обработано ${data.processed} изображений, успешно обновлено ${data.successCount} превью`,
      });
      
      // Refresh stats after processing
      loadStats();
    } catch (error) {
      console.error('Error regenerating previews:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка при перегенерации превью-изображений",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Оптимизация изображений</h1>
        
        <Tabs defaultValue="generate">
          <TabsList className="mb-6">
            <TabsTrigger value="generate">Создать превью</TabsTrigger>
            <TabsTrigger value="regenerate">Перегенерировать превью</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Статистика изображений</CardTitle>
                  <CardDescription>
                    Информация о изображениях в базе данных
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Всего изображений:</span>
                    <Badge variant="outline" className="text-lg">
                      {stats.total}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>С превью:</span>
                    <Badge variant="success" className="text-lg">
                      {stats.withPreviews}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Без превью:</span>
                    <Badge variant={stats.withoutPreviews > 0 ? "destructive" : "outline"} className="text-lg">
                      {stats.withoutPreviews}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Прогресс:</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
                <CardFooter>
                  <Button onClick={loadStats} variant="outline" size="sm" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Обновить статистику
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Генерация превью</CardTitle>
                  <CardDescription>
                    Создание оптимизированных версий изображений для каталога
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="batch-size" className="text-sm font-medium">
                      Размер пакета изображений:
                    </label>
                    <select 
                      id="batch-size"
                      className="w-full px-3 py-2 border rounded-md"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      disabled={isProcessing}
                    >
                      <option value="5">5 изображений</option>
                      <option value="10">10 изображений</option>
                      <option value="20">20 изображений</option>
                      <option value="50">50 изображений</option>
                      <option value="100">100 изображений</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="product-id" className="text-sm font-medium">
                        ID продукта (опционально):
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="product-id"
                        placeholder="Введите ID продукта для обработки только его изображений"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        disabled={isProcessing}
                        className="flex-1"
                      />
                      <Button 
                        onClick={processProduct} 
                        disabled={isProcessing || !productId}
                        size="sm"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Image className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {stats.processed > 0 && (
                    <div className="bg-secondary/20 p-3 rounded-md">
                      <p className="text-sm">В этой сессии:</p>
                      <p className="text-sm">Обработано: {stats.processed}</p>
                      <p className="text-sm">Успешно: {stats.success}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={processBatch} 
                    disabled={isProcessing || stats.withoutPreviews === 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : stats.withoutPreviews === 0 ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Все изображения оптимизированы
                      </>
                    ) : (
                      <>
                        <Image className="mr-2 h-4 w-4" />
                        Создать превью ({stats.withoutPreviews} осталось)
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="regenerate">
            <Card>
              <CardHeader>
                <CardTitle>Перегенерация превью-изображений</CardTitle>
                <CardDescription>
                  Используйте эту функцию для обновления существующих превью-изображений, если они отображаются некорректно
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800">Внимание</h4>
                      <p className="text-sm text-amber-700">
                        Эта функция перезапишет существующие превью-изображения. Используйте её, если изображения в каталоге 
                        отображаются в полном размере вместо оптимизированных версий.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="regenerate-batch-size" className="text-sm font-medium">
                    Количество изображений для перегенерации:
                  </label>
                  <select 
                    id="regenerate-batch-size"
                    className="w-full px-3 py-2 border rounded-md"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    disabled={isRegenerating}
                  >
                    <option value="5">5 изображений</option>
                    <option value="10">10 изображений</option>
                    <option value="20">20 изображений</option>
                    <option value="50">50 изображений</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={regeneratePreviews}
                  disabled={isRegenerating}
                  className="w-full"
                  variant="outline"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Перегенерация...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Перегенерировать превью-изображения
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Важная информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>
                    Превью изображений создаются с размером до 400px по ширине, 
                    оптимизированы в формате WebP для быстрой загрузки страницы каталога.
                  </p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-green-500 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>
                    Изображения с генерированными превью будут автоматически показываться
                    в каталоге в оптимизированной версии, а при клике на товар
                    загружаться в полном размере.
                  </p>
                </div>
                <div className="flex items-start">
                  <AlertCircle className="text-amber-500 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>
                    Если некоторые изображения все равно отображаются в полном размере, попробуйте воспользоваться
                    функцией "Перегенерировать превью" на вкладке "Перегенерировать превью".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminImageOptimizer;
