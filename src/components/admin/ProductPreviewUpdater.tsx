
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { massUpdateProductPreviewFlags, verifyProductPreviewGeneration } from "@/utils/imageProcessingUtils";

interface UpdateStats {
  processed: number;
  updated: number;
  failed: number;
}

export const ProductPreviewUpdater: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [productId, setProductId] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [stats, setStats] = useState<UpdateStats | null>(null);

  const handleProductUpdate = async () => {
    if (!productId) {
      toast({
        title: "Ошибка",
        description: "Введите ID продукта",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await verifyProductPreviewGeneration(productId);
      
      if (result.success) {
        toast({
          title: "Проверка завершена",
          description: `${result.imagesWithPreview} из ${result.totalImages} изображений имеют превью. Флаг has_preview: ${result.hasPreview ? "установлен" : "не установлен"}`
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось проверить превью для продукта",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying product preview:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при проверке превью",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMassUpdate = async () => {
    setIsProcessing(true);
    try {
      const results = await massUpdateProductPreviewFlags(batchSize);
      setStats(results);
      
      toast({
        title: "Обновление завершено",
        description: `Обработано ${results.processed} продуктов, обновлено ${results.updated}, ошибок: ${results.failed}`
      });
    } catch (error) {
      console.error("Error in mass update:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при массовом обновлении",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление превью для продуктов</CardTitle>
        <CardDescription>
          Проверка и обновление флага has_preview для существующих продуктов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="font-medium text-sm">Проверка отдельного продукта</div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="ID продукта"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleProductUpdate} 
              disabled={isProcessing || !productId}
              size="sm"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Проверить"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="font-medium text-sm">Массовое обновление флагов превью</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Количество продуктов"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
              className="w-32"
              min={1}
              max={500}
            />
            <Button 
              onClick={handleMassUpdate} 
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Обновить флаги превью
                </>
              )}
            </Button>
          </div>
        </div>

        {stats && (
          <div className="mt-4 p-4 bg-secondary/20 rounded-md">
            <h4 className="font-semibold mb-2 flex items-center">
              {stats.failed > 0 ? (
                <AlertTriangle className="text-amber-500 w-4 h-4 mr-2" />
              ) : (
                <CheckCircle className="text-green-500 w-4 h-4 mr-2" />
              )}
              Результаты обработки
            </h4>
            <div className="space-y-1 text-sm">
              <div>Всего обработано: <span className="font-medium">{stats.processed}</span></div>
              <div>Успешно обновлено: <span className="font-medium text-green-600">{stats.updated}</span></div>
              {stats.failed > 0 && (
                <div>С ошибками: <span className="font-medium text-red-600">{stats.failed}</span></div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Система автоматически отслеживает создание превью при загрузке новых изображений продуктов. Этот инструмент помогает восстановить флаги для существующих продуктов.</p>
      </CardFooter>
    </Card>
  );
};

export default ProductPreviewUpdater;
