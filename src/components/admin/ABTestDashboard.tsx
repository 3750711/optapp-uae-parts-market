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
    if (results.length > 0) {
      setReport(generateReport());
    }
  }, [results, generateReport]);

  const handleStartTest = () => {
    startTest();
    setReport(null);
  };

  const handleStopTest = () => {
    const finalResults = stopTest();
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
    if (variantName.includes('fast')) return 'bg-green-100 text-green-800';
    if (variantName.includes('ultra')) return 'bg-purple-100 text-purple-800';
    if (variantName.includes('instant')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDebounceTime = (variantName: string): string => {
    if (variantName.includes('500ms')) return '500ms';
    if (variantName.includes('300ms')) return '300ms';
    if (variantName.includes('200ms')) return '200ms';
    if (variantName.includes('100ms')) return '100ms';
    return 'Unknown';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Название теста</div>
                <div className="font-semibold">{currentTest.testName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Статус</div>
                <Badge variant={currentTest.isActive ? "default" : "secondary"}>
                  {currentTest.isActive ? "Активен" : "Завершен"}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Дата начала</div>
                <div className="font-semibold">
                  {new Date(currentTest.startDate).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Количество вариантов</div>
                <div className="font-semibold">{currentTest.variants.length}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">Варианты теста</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {currentTest.variants.map((variant) => (
                  <div
                    key={variant.name}
                    className={`p-3 rounded-lg ${getVariantColor(variant.name)}`}
                  >
                    <div className="font-semibold text-sm">{variant.name}</div>
                    <div className="text-xs">
                      Debounce: {formatDebounceTime(variant.name)}
                    </div>
                    <div className="text-xs">
                      Вес: {variant.weight}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Результаты теста
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.variant} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getVariantColor(result.variant)}>
                        {result.variant}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Debounce: {formatDebounceTime(result.variant)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.userCount} пользователей
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Успешность</div>
                      <div className="text-lg font-semibold">{result.successRate.toFixed(1)}%</div>
                      <Progress value={result.successRate} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Средняя латентность</div>
                      <div className="text-lg font-semibold">{result.avgLatency.toFixed(0)}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Конверсия</div>
                      <div className="text-lg font-semibold">{result.conversionRate.toFixed(1)}%</div>
                      <Progress value={result.conversionRate} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Удовлетворенность</div>
                      <div className="text-lg font-semibold">{result.userSatisfaction.toFixed(0)}/100</div>
                      <Progress value={result.userSatisfaction} className="h-2 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
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
              Анализ и рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistical Significance */}
            {report.significance.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Статистическая значимость</h4>
                {report.significance.map((sig: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                    {sig.isSignificant ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{sig.comparison}</div>
                      <div className="text-sm text-muted-foreground">
                        Уровень значимости: {sig.confidence.toFixed(1)}% 
                        ({sig.isSignificant ? 'Значимо' : 'Незначимо'})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold mb-2">Рекомендации</h4>
              <div className="space-y-2">
                {report.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-sm text-blue-800">{rec}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Summary */}
            {report.results.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Сводка производительности</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-sm text-green-600">Лучшая успешность</div>
                    <div className="font-semibold text-green-800">
                      {Math.max(...report.results.map((r: any) => r.successRate)).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="text-sm text-purple-600">Лучшая латентность</div>
                    <div className="font-semibold text-purple-800">
                      {Math.min(...report.results.map((r: any) => r.avgLatency)).toFixed(0)}ms
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="text-sm text-orange-600">Лучшая конверсия</div>
                    <div className="font-semibold text-orange-800">
                      {Math.max(...report.results.map((r: any) => r.conversionRate)).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Test Running */}
      {!currentTest && (
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