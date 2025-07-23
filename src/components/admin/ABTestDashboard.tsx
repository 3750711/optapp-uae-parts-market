import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  TrendingUp, 
  Users, 
  Target,
  FileDown,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useABTest } from '@/hooks/use-ab-test';

export const ABTestDashboard: React.FC = () => {
  const { 
    currentTest, 
    results, 
    startTest, 
    stopTest, 
    generateReport,
    isTestActive 
  } = useABTest();

  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (results && results.totalInteractions > 0) {
      const generatedReport = generateReport();
      setReport(generatedReport);
    }
  }, [results, generateReport]);

  const handleStartTest = () => {
    startTest();
    setReport(null);
  };

  const handleStopTest = () => {
    stopTest();
    const finalReport = generateReport();
    setReport(finalReport);
  };

  const exportReport = () => {
    if (!report) return;
    
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ab-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getVariantColor = (variantName: string): string => {
    if (variantName.includes('control')) return 'bg-blue-100 text-blue-800';
    if (variantName.includes('optimized')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">A/B Testing Dashboard</h2>
          <p className="text-muted-foreground">
            Тестирование оптимального debounce timing для price offers
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isTestActive ? (
            <Button onClick={handleStartTest} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Запустить тест
            </Button>
          ) : (
            <Button variant="outline" onClick={handleStopTest} className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Остановить тест
            </Button>
          )}
          
          {report && (
            <Button variant="outline" onClick={exportReport} className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Экспорт отчета
            </Button>
          )}
        </div>
      </div>

      {/* Test Status */}
      {currentTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Статус теста
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Текущий вариант</div>
                <div className="font-semibold">{currentTest.variant}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Статус</div>
                <Badge variant={isTestActive ? "default" : "secondary"}>
                  {isTestActive ? "Активен" : "Завершен"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Взаимодействий</div>
                <div className="font-semibold">{currentTest.totalInteractions}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">Конфигурация</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-semibold text-sm">Debounce время</div>
                  <div className="text-xs">{currentTest.config.debounceTime}ms</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-semibold text-sm">Попытки переподключения</div>
                  <div className="text-xs">{currentTest.config.maxReconnectAttempts}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-semibold text-sm">Размер batch</div>
                  <div className="text-xs">{currentTest.config.batchSize}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && results.totalInteractions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Результаты теста
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getVariantColor(results.variant)}>
                      {results.variant}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {results.totalInteractions} взаимодействий
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Debounce время</div>
                    <div className="text-lg font-semibold">{results.config.debounceTime}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Размер batch</div>
                    <div className="text-lg font-semibold">{results.config.batchSize}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Переподключения</div>
                    <div className="text-lg font-semibold">{results.config.maxReconnectAttempts}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report and Recommendations */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Анализ результатов
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Сводка теста</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-sm text-blue-600">Вариант</div>
                  <div className="font-semibold text-blue-800">{report.variant}</div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-sm text-green-600">Общие взаимодействия</div>
                  <div className="font-semibold text-green-800">{report.totalInteractions}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Конфигурация</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600">Debounce</div>
                  <div className="font-semibold">{report.config.debounceTime}ms</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600">Batch размер</div>
                  <div className="font-semibold">{report.config.batchSize}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600">Переподключения</div>
                  <div className="font-semibold">{report.config.maxReconnectAttempts}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Test Running */}
      {!currentTest && !isTestActive && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">A/B тест не запущен</h3>
            <p className="text-muted-foreground mb-4">
              Запустите A/B тест для оптимизации debounce timing в price offers системе
            </p>
            <Button onClick={handleStartTest} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Запустить тест
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};