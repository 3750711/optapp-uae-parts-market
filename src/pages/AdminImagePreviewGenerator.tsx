
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const AdminImagePreviewGenerator: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [batchSize, setBatchSize] = useState(10);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  React.useEffect(() => {
    if (profile && profile.user_type !== 'admin') {
      navigate('/');
    }
  }, [profile, navigate]);

  const handleGeneratePreviews = async () => {
    if (!user) {
      toast({
        title: "Ошибка авторизации",
        description: "Для доступа к этой функции необходимо авторизоваться как администратор",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Ошибка получения сессии");
      }

      const { data, error } = await supabase.functions.invoke('generate-previews', {
        body: {
          batchSize: parseInt(String(batchSize), 10),
          startIndex: currentBatchIndex,
          limit: 100
        }
      });

      if (error) {
        throw error;
      }

      if (data) {
        setResult(data);
        setTotalProcessed(prev => prev + (data.stats?.processed || 0));
        
        if (data.nextBatchIndex !== null) {
          setCurrentBatchIndex(data.nextBatchIndex);
        }
      }
    } catch (err) {
      console.error("Error generating previews:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать превью изображений",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!result || !result.stats) return 0;
    return Math.min(100, (totalProcessed / (result.stats.totalImages || 1)) * 100);
  };

  if (!user || !profile) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>Загрузка...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Генерация превью изображений</CardTitle>
            <CardDescription>
              Эта утилита создает оптимизированные версии изображений продуктов для быстрой загрузки в каталоге
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <Alert variant="default" className={result.stats.errors > 0 ? "border-orange-200" : "border-green-200"}>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Результаты обработки</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      <p>Обработано изображений: {result.stats.processed} из {result.stats.totalImages}</p>
                      <p>Всего обработано: {totalProcessed}</p>
                      {result.stats.errors > 0 && (
                        <p className="text-orange-600">Ошибок: {result.stats.errors}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Общий прогресс</Label>
                  <Progress value={calculateProgress()} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{Math.round(calculateProgress())}%</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Размер пакета</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                    disabled={isProcessing}
                    min={1}
                    max={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startIndex">Текущий индекс</Label>
                  <Input
                    id="startIndex"
                    type="number"
                    value={currentBatchIndex}
                    onChange={(e) => setCurrentBatchIndex(parseInt(e.target.value) || 0)}
                    disabled={isProcessing}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setCurrentBatchIndex(0);
                setTotalProcessed(0);
              }}
              disabled={isProcessing}
            >
              Сбросить
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePreviews}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    Генерировать превью
                  </>
                )}
              </Button>
              
              {result && result.stats && result.stats.hasMoreProducts && (
                <Button
                  onClick={handleGeneratePreviews}
                  disabled={isProcessing}
                  variant="secondary"
                >
                  Следующий пакет
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminImagePreviewGenerator;
