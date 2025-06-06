
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  syncProductPreviews, 
  syncProductPreviewByLot, 
  findMismatchedPreviews,
  PreviewSyncResult 
} from "@/utils/previewSync";
import { 
  RefreshCcw, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2 
} from "lucide-react";

export const PreviewSyncManager: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lotNumber, setLotNumber] = useState('');
  const [syncResult, setSyncResult] = useState<PreviewSyncResult | null>(null);
  const [mismatchedCount, setMismatchedCount] = useState<number | null>(null);

  // Поиск товаров с несоответствующими preview URLs
  const handleFindMismatched = async () => {
    setIsLoading(true);
    try {
      const result = await findMismatchedPreviews();
      setMismatchedCount(result.mismatched.length);
      
      if (result.mismatched.length > 0) {
        toast({
          title: "Найдены несоответствия",
          description: `Найдено ${result.mismatched.length} товаров с устаревшими preview URL`,
          variant: "default"
        });
      } else {
        toast({
          title: "Все в порядке",
          description: "Все preview URL соответствуют актуальным изображениям",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить preview URLs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Синхронизация всех товаров с несоответствующими preview URLs
  const handleSyncAll = async () => {
    setIsLoading(true);
    setSyncResult(null);
    
    try {
      const result = await syncProductPreviews();
      setSyncResult(result);
      
      if (result.updated > 0) {
        toast({
          title: "Синхронизация завершена",
          description: `Обновлено ${result.updated} из ${result.totalProcessed} товаров`,
          variant: "default"
        });
      } else {
        toast({
          title: "Нет обновлений",
          description: "Все preview URL уже актуальны",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка синхронизации",
        description: "Не удалось выполнить синхронизацию",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Синхронизация конкретного товара по лот номеру
  const handleSyncByLot = async () => {
    if (!lotNumber) {
      toast({
        title: "Ошибка",
        description: "Введите номер лота",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setSyncResult(null);
    
    try {
      const result = await syncProductPreviewByLot(parseInt(lotNumber));
      setSyncResult(result);
      
      if (result.updated > 0) {
        toast({
          title: "Товар обновлен",
          description: `Preview URL для лота ${lotNumber} успешно обновлен`,
          variant: "default"
        });
      } else if (result.errors.length > 0) {
        toast({
          title: "Ошибка",
          description: result.errors[0],
          variant: "destructive"
        });
      } else {
        toast({
          title: "Без изменений",
          description: `Preview URL для лота ${lotNumber} уже актуален`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить товар",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (action: string) => {
    switch (action) {
      case 'updated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (action: string) => {
    switch (action) {
      case 'updated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Обновлен</Badge>;
      case 'error':
        return <Badge variant="destructive">Ошибка</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Пропущен</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5" />
          Синхронизация Preview URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Поиск несоответствий */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Проверка несоответствий</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFindMismatched}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Найти проблемы
            </Button>
          </div>
          
          {mismatchedCount !== null && (
            <Alert>
              <AlertDescription>
                {mismatchedCount > 0 ? (
                  <>Найдено <strong>{mismatchedCount}</strong> товаров с устаревшими preview URL</>
                ) : (
                  <>Все preview URL актуальны</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Синхронизация по лот номеру */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Синхронизация конкретного товара</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Номер лота (например, 8010)"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSyncByLot}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Синхронизировать
            </Button>
          </div>
        </div>

        <Separator />

        {/* Массовая синхронизация */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Массовая синхронизация</Label>
            <Button
              onClick={handleSyncAll}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Синхронизировать все
            </Button>
          </div>
          <Alert>
            <AlertDescription>
              Обновит preview URL для всех товаров с несоответствующими изображениями
            </AlertDescription>
          </Alert>
        </div>

        {/* Результаты синхронизации */}
        {syncResult && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Результаты синхронизации</Label>
                <div className="flex gap-2">
                  <Badge variant="outline">Обработано: {syncResult.totalProcessed}</Badge>
                  <Badge variant="default">Обновлено: {syncResult.updated}</Badge>
                  {syncResult.errors.length > 0 && (
                    <Badge variant="destructive">Ошибок: {syncResult.errors.length}</Badge>
                  )}
                </div>
              </div>

              {syncResult.details.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {syncResult.details.map((detail, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(detail.action)}
                        <span className="font-medium">Лот {detail.lot_number}</span>
                        <span className="text-gray-600 truncate max-w-48">{detail.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(detail.action)}
                        <span className="text-gray-500 text-xs max-w-32 truncate">{detail.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {syncResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Ошибки:</strong>
                      {syncResult.errors.slice(0, 3).map((error, index) => (
                        <div key={index} className="text-xs">{error}</div>
                      ))}
                      {syncResult.errors.length > 3 && (
                        <div className="text-xs">...и еще {syncResult.errors.length - 3} ошибок</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
