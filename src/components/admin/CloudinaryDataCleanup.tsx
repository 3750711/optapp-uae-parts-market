
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cleanupCloudinaryData, cleanupSingleProduct, CleanupResult } from '@/utils/cloudinaryDataCleaner';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const CloudinaryDataCleanup: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [singleProductId, setSingleProductId] = useState('');
  const { toast } = useToast();

  const handleFullCleanup = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResult(null);

    try {
      const cleanupResult = await cleanupCloudinaryData();
      setResult(cleanupResult);

      if (cleanupResult.success) {
        toast({
          title: 'Очистка завершена',
          description: `Обработано: ${cleanupResult.processed}, обновлено: ${cleanupResult.updated}`,
        });
      } else {
        toast({
          title: 'Очистка завершена с ошибками',
          description: `Ошибки: ${cleanupResult.errors.length}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка очистки',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSingleProductCleanup = async () => {
    if (!singleProductId.trim() || isRunning) return;

    setIsRunning(true);

    try {
      const success = await cleanupSingleProduct(singleProductId.trim());
      
      if (success) {
        toast({
          title: 'Товар очищен',
          description: `Товар ${singleProductId} успешно обновлен`,
        });
        setSingleProductId('');
      } else {
        toast({
          title: 'Ошибка очистки товара',
          description: 'Не удалось обновить товар',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Очистка данных Cloudinary</CardTitle>
          <CardDescription>
            Инструменты для исправления неправильных public_id и регенерации preview URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Полная очистка всех товаров</h4>
            <p className="text-sm text-gray-600">
              Очищает public_id от версионных префиксов и регенерирует preview URL для всех товаров
            </p>
            <Button 
              onClick={handleFullCleanup} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Выполняется очистка...
                </>
              ) : (
                'Запустить полную очистку'
              )}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium">Очистка отдельного товара</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ID товара"
                value={singleProductId}
                onChange={(e) => setSingleProductId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={isRunning}
              />
              <Button 
                onClick={handleSingleProductCleanup}
                disabled={!singleProductId.trim() || isRunning}
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Очистить'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Результат очистки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Обработано товаров</p>
                <p className="text-2xl font-bold">{result.processed}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Обновлено товаров</p>
                <p className="text-2xl font-bold">{result.updated}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Ошибки ({result.errors.length}):</p>
                    {result.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-xs">{error}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs">... и еще {result.errors.length - 5} ошибок</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Очистка успешно завершена! Все товары с неправильными public_id были исправлены.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CloudinaryDataCleanup;
