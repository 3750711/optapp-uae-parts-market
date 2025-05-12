
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminImageOptimizer: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withPreviews: 0,
    withoutPreviews: 0,
    processed: 0,
    success: 0,
  });
  const [progress, setProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(20);

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

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Оптимизация изображений</h1>
        
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
                    Процесс генерации превью может занять некоторое время, особенно
                    если в базе много товаров. Рекомендуется запускать обработку партиями.
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
