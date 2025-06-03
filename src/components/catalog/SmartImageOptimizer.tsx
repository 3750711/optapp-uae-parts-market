
import React, { useEffect, useState } from 'react';
import { useSmartThumbnailManager } from '@/hooks/useSmartThumbnailManager';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, CheckCircle, AlertCircle } from 'lucide-react';

interface SmartImageOptimizerProps {
  autoStart?: boolean;
  batchSize?: number;
  showProgress?: boolean;
}

const SmartImageOptimizer: React.FC<SmartImageOptimizerProps> = ({
  autoStart = true,
  batchSize = 15,
  showProgress = true
}) => {
  const {
    isProcessing,
    processedCount,
    totalToProcess,
    progressPercentage,
    hasImagesInQueue,
    startAutoProcessing,
    getImagesNeedingPreviews
  } = useSmartThumbnailManager();

  const [needsProcessing, setNeedsProcessing] = useState<number | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Проверяем количество изображений, которым нужны превью
  const checkImagesNeedingProcessing = async () => {
    try {
      const images = await getImagesNeedingPreviews(100); // Проверяем больше для статистики
      setNeedsProcessing(images.length);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking images needing processing:', error);
    }
  };

  // Автоматически запускаем проверку и обработку при загрузке
  useEffect(() => {
    checkImagesNeedingProcessing();
    
    if (autoStart) {
      const timer = setTimeout(() => {
        startAutoProcessing(batchSize);
      }, 1000); // Небольшая задержка для избежания конфликтов

      return () => clearTimeout(timer);
    }
  }, [autoStart, batchSize, startAutoProcessing]);

  // Обновляем статистику после завершения обработки
  useEffect(() => {
    if (!isProcessing && processedCount > 0) {
      setTimeout(checkImagesNeedingProcessing, 2000);
    }
  }, [isProcessing, processedCount]);

  const handleManualStart = () => {
    startAutoProcessing(batchSize);
  };

  if (!showProgress && !isProcessing && needsProcessing === 0) {
    return null; // Скрываем компонент если нет работы
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Оптимизация изображений</CardTitle>
          </div>
          
          {needsProcessing !== null && (
            <Badge variant={needsProcessing > 0 ? "secondary" : "default"} className="text-xs">
              {needsProcessing > 0 ? `${needsProcessing} требуют обработки` : 'Все оптимизированы'}
            </Badge>
          )}
        </div>
        
        <CardDescription className="text-sm">
          Автоматическая генерация каталожных превью (~20KB) для быстрой загрузки
          {lastCheck && (
            <span className="block text-xs text-gray-500 mt-1">
              Последняя проверка: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isProcessing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Обработка изображений... {processedCount} из {totalToProcess}</span>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="text-xs text-gray-600">
              {progressPercentage}% завершено
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {needsProcessing === null ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Проверка изображений...</span>
              </div>
            ) : needsProcessing > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>Найдено {needsProcessing} изображений без оптимизированных превью</span>
                </div>
                
                <Button 
                  onClick={handleManualStart} 
                  size="sm" 
                  className="w-full"
                  disabled={isProcessing}
                >
                  Запустить оптимизацию
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>Все изображения оптимизированы</span>
              </div>
            )}
            
            {processedCount > 0 && (
              <div className="text-xs text-gray-500">
                В последней сессии обработано: {processedCount} изображений
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartImageOptimizer;
