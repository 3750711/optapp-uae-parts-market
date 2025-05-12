
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Search, RotateCw, Eye } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { massUpdateProductPreviewFlags, verifyProductPreviewGeneration, generateProductPreviews } from "@/utils/imageProcessingUtils";
import { supabase } from "@/integrations/supabase/client";

interface UpdateStats {
  processed: number;
  updated: number;
  failed: number;
}

interface ProductPreviewStatus {
  id: string;
  hasPreview: boolean;
  totalImages: number;
  imagesWithPreview: number;
  images?: Array<{id: string, url: string, preview_url: string | null}>;
}

export const ProductPreviewUpdater: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [productId, setProductId] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [productStatus, setProductStatus] = useState<ProductPreviewStatus | null>(null);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [detailedLogs, setDetailedLogs] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const handleProductCheck = async () => {
    if (!productId) {
      toast({
        title: "Ошибка",
        description: "Введите ID продукта",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setProductStatus(null);
    setGenerationResult(null);
    setDetailedLogs([]);
    
    try {
      // Add debug log
      const debugLog = `[${new Date().toISOString()}] Starting product check for ID: ${productId}`;
      setDetailedLogs(prev => [...prev, debugLog]);
      
      const result = await verifyProductPreviewGeneration(productId);
      
      if (result.success) {
        // Fetch additional image data for debugging
        const { data: imageData, error: imageError } = await supabase
          .from('product_images')
          .select('id, url, preview_url')
          .eq('product_id', productId);
          
        if (imageError) {
          setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Error fetching image data: ${imageError.message}`]);
        } else {
          setDetailedLogs(prev => [...prev, 
            `[${new Date().toISOString()}] Fetched ${imageData?.length || 0} images for product ${productId}`,
            ...imageData.map(img => `Image: ${img.url} | Preview: ${img.preview_url || 'MISSING'}`)
          ]);
        }
        
        setProductStatus({
          id: productId,
          hasPreview: result.hasPreview,
          totalImages: result.totalImages,
          imagesWithPreview: result.imagesWithPreview,
          images: imageData
        });
        
        toast({
          title: "Проверка завершена",
          description: `${result.imagesWithPreview} из ${result.totalImages} изображений имеют превью. Флаг has_preview: ${result.hasPreview ? "установлен" : "не установлен"}`
        });
      } else {
        setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Product check failed`]);
        toast({
          title: "Ошибка",
          description: "Не удалось проверить превью для продукта",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error verifying product preview:", error);
      setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Exception during check: ${error instanceof Error ? error.message : String(error)}`]);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при проверке превью",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleGeneratePreviews = async () => {
    if (!productId) {
      toast({
        title: "Ошибка",
        description: "Введите ID продукта",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setGenerationResult(null);
    setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Starting preview generation for product: ${productId}`]);
    
    try {
      // Call the Edge Function directly to generate previews
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { 
          action: 'verify_product', 
          productId
        }
      });
      
      if (error) {
        console.error("Error generating previews:", error);
        setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Edge function error: ${error.message}`]);
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при генерации превью",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Preview generation response:", data);
      setDetailedLogs(prev => [...prev, 
        `[${new Date().toISOString()}] Edge function response:`,
        `Success: ${data.success}`,
        `Message: ${data.message}`,
        `Total Images: ${data.totalImages || 0}`,
        `Updated Images: ${data.updatedImages || 0}`
      ]);
      
      if (data.success) {
        setGenerationResult(`${data.message}. Обработано изображений: ${data.totalImages}, обновлено: ${data.updatedImages}`);
        toast({
          title: "Превью сгенерированы",
          description: data.message
        });
        
        // Verify database updates for previews
        setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Verifying database updates for previews...`]);
        const { data: updatedImages, error: dbCheckError } = await supabase
          .from('product_images')
          .select('id, url, preview_url')
          .eq('product_id', productId);
          
        if (dbCheckError) {
          setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Error checking database: ${dbCheckError.message}`]);
        } else {
          setDetailedLogs(prev => [...prev, 
            `[${new Date().toISOString()}] Database check complete. Found ${updatedImages.length} images.`,
            ...updatedImages.map(img => `Image ID: ${img.id} | Preview URL: ${img.preview_url || 'MISSING'}`)
          ]);
        }
        
        // Manually update the has_preview flag to ensure it's set correctly
        const { error: flagError } = await supabase.rpc('update_product_has_preview_flag', {
          p_product_id: productId
        });
        
        if (flagError) {
          setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Error updating flag: ${flagError.message}`]);
        } else {
          setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Has_preview flag updated successfully`]);
        }
        
        // Automatically re-check the status after generation
        await handleProductCheck();
      } else {
        setGenerationResult(`Ошибка: ${data.message}`);
        setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Edge function reported error: ${data.message}`]);
        toast({
          title: "Ошибка",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating previews:", error);
      setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Exception during generation: ${error instanceof Error ? error.message : String(error)}`]);
      setGenerationResult(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при генерации превью",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // New function to explicitly update preview URLs in the database
  const handleUpdatePreviewDb = async () => {
    if (!productId || !productStatus?.images) {
      toast({
        title: "Ошибка",
        description: "Сначала проверьте превью для продукта",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Starting database update for previews...`]);
    
    try {
      // For each image that has a missing preview but should have one
      let updatedCount = 0;
      
      for (const img of productStatus.images) {
        if (!img.preview_url) {
          // Try to construct the preview URL from the original URL
          const urlParts = img.url.split('.');
          const extension = urlParts.pop() || '';
          const basePath = urlParts.join('.');
          const possiblePreviewUrl = `${basePath}-preview.webp`;
          
          setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Trying to update preview for image ${img.id} to ${possiblePreviewUrl}`]);
          
          // Update the preview_url in the database
          const { error } = await supabase
            .from('product_images')
            .update({ preview_url: possiblePreviewUrl })
            .eq('id', img.id);
            
          if (error) {
            setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Error updating image ${img.id}: ${error.message}`]);
          } else {
            updatedCount++;
            setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Successfully updated image ${img.id}`]);
          }
        }
      }
      
      // Update the has_preview flag
      const { error: flagError } = await supabase.rpc('update_product_has_preview_flag', {
        p_product_id: productId
      });
      
      if (flagError) {
        setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Error updating flag: ${flagError.message}`]);
      } else {
        setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Has_preview flag updated successfully`]);
      }
      
      toast({
        title: "База данных обновлена",
        description: `Обновлено ${updatedCount} записей в базе данных`
      });
      
      // Refresh status
      await handleProductCheck();
    } catch (error) {
      console.error("Error updating database:", error);
      setDetailedLogs(prev => [...prev, `[${new Date().toISOString()}] Exception during DB update: ${error instanceof Error ? error.message : String(error)}`]);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении базы данных",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMassUpdate = async () => {
    setIsProcessing(true);
    setStats(null);
    
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
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="ID продукта"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleProductCheck} 
              disabled={isChecking || !productId}
              size="sm"
              variant="outline"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Search className="h-4 w-4 mr-1" />
              )}
              Проверить
            </Button>
          </div>

          {productStatus && (
            <div className="p-3 bg-secondary/20 rounded-md">
              <h4 className="font-semibold mb-2 flex items-center">
                {productStatus.hasPreview ? (
                  <CheckCircle className="text-green-500 w-4 h-4 mr-2" />
                ) : (
                  <AlertTriangle className="text-amber-500 w-4 h-4 mr-2" />
                )}
                Статус превью
              </h4>
              <div className="space-y-1 text-sm">
                <div>Всего изображений: <span className="font-medium">{productStatus.totalImages}</span></div>
                <div>С превью: <span className="font-medium">{productStatus.imagesWithPreview}</span></div>
                <div>Флаг has_preview: <span className={`font-medium ${productStatus.hasPreview ? 'text-green-600' : 'text-red-600'}`}>
                  {productStatus.hasPreview ? "Установлен" : "Не установлен"}
                </span></div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {productStatus.imagesWithPreview < productStatus.totalImages && (
                  <Button
                    onClick={handleGeneratePreviews}
                    disabled={isProcessing}
                    size="sm"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RotateCw className="h-4 w-4 mr-1" />
                    )}
                    Сгенерировать превью
                  </Button>
                )}
                
                <Button
                  onClick={handleUpdatePreviewDb}
                  disabled={isProcessing || !productStatus}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Обновить БД
                </Button>
                
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  size="sm"
                  variant="ghost"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showDetails ? "Скрыть детали" : "Показать детали"}
                </Button>
              </div>
            </div>
          )}

          {showDetails && productStatus?.images && (
            <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto max-h-80">
              <h4 className="font-semibold mb-2">Детали изображений</h4>
              <div className="space-y-2 text-xs">
                {productStatus.images.map((img, idx) => (
                  <div key={img.id} className="border-b pb-2">
                    <div className="font-medium">Изображение {idx + 1}</div>
                    <div className="truncate">URL: {img.url}</div>
                    <div className={img.preview_url ? "text-green-600" : "text-red-600"}>
                      Preview URL: {img.preview_url || 'Отсутствует'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generationResult && (
            <div className={`p-3 rounded-md ${generationResult.includes("Ошибка") ? "bg-red-100" : "bg-green-100"}`}>
              <p className="text-sm">{generationResult}</p>
            </div>
          )}
          
          {showDetails && detailedLogs.length > 0 && (
            <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto max-h-80">
              <h4 className="font-semibold mb-2">Логи операций</h4>
              <pre className="text-xs whitespace-pre-wrap">
                {detailedLogs.map((log, idx) => (
                  <div key={idx} className="pb-1">{log}</div>
                ))}
              </pre>
            </div>
          )}
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
