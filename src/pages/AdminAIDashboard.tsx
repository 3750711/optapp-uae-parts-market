import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  BarChart3,
  Database,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAutoAIProcessing } from '@/hooks/useAutoAIProcessing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminAIDashboard = () => {
  const { toast } = useToast();
  const [aiSettings, setAiSettings] = useState({
    autoProcessing: true,
    confidenceThreshold: 0.8,
    maxRetries: 3,
    processInterval: 30
  });
  
  const [statistics, setStatistics] = useState({
    totalProcessed: 0,
    totalPending: 0,
    avgConfidence: 0,
    successRate: 0,
    processingTimeMs: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const { 
    isProcessing, 
    pendingProducts, 
    processedCount, 
    failedCount,
    triggerProductProcessing,
    stats 
  } = useAutoAIProcessing({ 
    enabled: aiSettings.autoProcessing,
    checkInterval: aiSettings.processInterval,
    maxRetries: aiSettings.maxRetries
  });

  // Load AI statistics
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_enrichment_logs')
          .select('confidence, processing_time_ms, created_at')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) throw error;

        if (data && data.length > 0) {
          const totalProcessed = data.length;
          const avgConfidence = data.reduce((sum, log) => sum + (log.confidence || 0), 0) / totalProcessed;
          const avgProcessingTime = data.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / totalProcessed;
          const highConfidenceCount = data.filter(log => (log.confidence || 0) >= 0.8).length;
          const successRate = (highConfidenceCount / totalProcessed) * 100;

          setStatistics({
            totalProcessed,
            totalPending: stats.pending,
            avgConfidence: Math.round(avgConfidence * 100),
            successRate: Math.round(successRate),
            processingTimeMs: Math.round(avgProcessingTime)
          });
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    };

    loadStatistics();
  }, [stats.pending, processedCount]);

  const handleRunBatchProcessing = async () => {
    setIsLoading(true);
    try {
      // Trigger batch processing for all pending products
      for (const product of pendingProducts.slice(0, 5)) { // Process first 5
        await triggerProductProcessing(product.id);
      }
      
      toast({
        title: '🤖 Batch обработка запущена',
        description: `Обрабатывается ${Math.min(5, pendingProducts.length)} товаров`
      });
    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: 'Ошибка batch обработки',
        description: 'Попробуйте позже',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      // Save settings to database
      await supabase
        .from('app_settings')
        .upsert([
          { key: 'ai_auto_processing', value: aiSettings.autoProcessing.toString() },
          { key: 'ai_confidence_threshold', value: aiSettings.confidenceThreshold.toString() },
          { key: 'ai_max_retries', value: aiSettings.maxRetries.toString() },
          { key: 'ai_process_interval', value: aiSettings.processInterval.toString() }
        ]);

      toast({
        title: 'Настройки сохранены',
        description: 'AI конфигурация обновлена'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <DashboardHeader 
            title="AI Dashboard" 
          />

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего обработано</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalProcessed}</div>
                <p className="text-xs text-muted-foreground">За все время</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ожидают обработки</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {isProcessing ? 'Обрабатывается...' : 'В очереди'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средняя точность</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.avgConfidence}%</div>
                <p className="text-xs text-muted-foreground">AI уверенность</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Успешность</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.successRate}%</div>
                <p className="text-xs text-muted-foreground">Высокая точность</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="processing">Обработка</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Current Processing Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Статус AI системы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Автоматическая обработка</span>
                    <Badge variant={aiSettings.autoProcessing ? "default" : "secondary"}>
                      {aiSettings.autoProcessing ? "Включена" : "Выключена"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Текущий статус</span>
                    <Badge variant={isProcessing ? "default" : "secondary"}>
                      {isProcessing ? "Обрабатывает" : "Ожидает"}
                    </Badge>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс обработки</span>
                        <span>{processedCount} / {stats.pending + processedCount}</span>
                      </div>
                      <Progress value={(processedCount / (stats.pending + processedCount)) * 100} />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{processedCount}</div>
                      <div className="text-xs text-muted-foreground">Обработано</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                      <div className="text-xs text-muted-foreground">В очереди</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                      <div className="text-xs text-muted-foreground">Ошибки</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Метрики производительности</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Среднее время обработки</span>
                    <span className="font-mono">{statistics.processingTimeMs}ms</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Интервал проверки</span>
                    <span className="font-mono">{aiSettings.processInterval}s</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Максимум повторов</span>
                    <span className="font-mono">{aiSettings.maxRetries}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Управление обработкой
                  </CardTitle>
                  <CardDescription>
                    Ручное управление AI обработкой товаров
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleRunBatchProcessing}
                    disabled={isLoading || isProcessing || stats.pending === 0}
                    className="w-full"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bot className="h-4 w-4 mr-2" />
                    )}
                    Запустить batch обработку ({Math.min(5, stats.pending)} товаров)
                  </Button>

                  {stats.pending === 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Все товары обработаны! Новые товары будут автоматически обрабатываться при создании.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Pending Products List */}
                  {pendingProducts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Ожидают обработки:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {pendingProducts.slice(0, 10).map(product => (
                          <div key={product.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="text-sm truncate flex-1 mr-2">
                              {product.title}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => triggerProductProcessing(product.id)}
                              disabled={isProcessing}
                            >
                              <Sparkles className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      {pendingProducts.length > 10 && (
                        <p className="text-xs text-muted-foreground">
                          и еще {pendingProducts.length - 10} товаров...
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Настройки AI системы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-processing">Автоматическая обработка</Label>
                    <Switch
                      id="auto-processing"
                      checked={aiSettings.autoProcessing}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({ ...prev, autoProcessing: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confidence-threshold">Порог уверенности для автоприменения</Label>
                    <Input
                      id="confidence-threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiSettings.confidenceThreshold}
                      onChange={(e) =>
                        setAiSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-retries">Максимум повторов при ошибке</Label>
                    <Input
                      id="max-retries"
                      type="number"
                      min="1"
                      max="10"
                      value={aiSettings.maxRetries}
                      onChange={(e) =>
                        setAiSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="process-interval">Интервал проверки (секунды)</Label>
                    <Input
                      id="process-interval"
                      type="number"
                      min="10"
                      max="300"
                      value={aiSettings.processInterval}
                      onChange={(e) =>
                        setAiSettings(prev => ({ ...prev, processInterval: parseInt(e.target.value) }))
                      }
                    />
                  </div>

                  <Button onClick={handleSettingsUpdate} className="w-full">
                    Сохранить настройки
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
};

export default AdminAIDashboard;