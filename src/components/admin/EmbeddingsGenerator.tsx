import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Brain, Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEmbeddingsGenerator } from '@/hooks/useEmbeddingsGenerator';

export const EmbeddingsGenerator: React.FC = () => {
  const { 
    generateEmbeddings, 
    fetchStats, 
    isGenerating, 
    progress, 
    stats, 
    selectedStatuses, 
    setSelectedStatuses 
  } = useEmbeddingsGenerator();

  useEffect(() => {
    fetchStats();
  }, []);

  const getProgressPercentage = () => {
    if (!progress || !progress.total) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status]);
    } else {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    }
  };

  const getStatusInfo = (status: 'active' | 'sold') => {
    if (!stats) return { total: 0, embeddings: 0, percentage: 0 };
    
    const total = status === 'active' ? stats.activeProducts : stats.soldProducts;
    const embeddings = status === 'active' ? stats.activeEmbeddings : stats.soldEmbeddings;
    const percentage = total > 0 ? Math.round((embeddings / total) * 100) : 0;
    
    return { total, embeddings, percentage };
  };

  const activeInfo = getStatusInfo('active');
  const soldInfo = getStatusInfo('sold');

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Embeddings
        </CardTitle>
        <CardDescription>
          Генерация векторных представлений для поиска товаров
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Статусы товаров для обработки:</div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={selectedStatuses.includes('active')}
                  onCheckedChange={(checked) => handleStatusChange('active', !!checked)}
                />
                <label htmlFor="active" className="text-sm cursor-pointer">
                  Активные товары ({activeInfo.embeddings}/{activeInfo.total})
                  {activeInfo.percentage === 100 && <CheckCircle2 className="inline h-4 w-4 ml-1 text-green-500" />}
                  {activeInfo.percentage < 100 && activeInfo.percentage > 0 && <AlertCircle className="inline h-4 w-4 ml-1 text-yellow-500" />}
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sold"
                  checked={selectedStatuses.includes('sold')}
                  onCheckedChange={(checked) => handleStatusChange('sold', !!checked)}
                />
                <label htmlFor="sold" className="text-sm cursor-pointer">
                  Проданные товары ({soldInfo.embeddings}/{soldInfo.total})
                  {soldInfo.percentage === 100 && <CheckCircle2 className="inline h-4 w-4 ml-1 text-green-500" />}
                  {soldInfo.percentage < 100 && soldInfo.percentage > 0 && <AlertCircle className="inline h-4 w-4 ml-1 text-yellow-500" />}
                </label>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Активные:</span>
                  <span>{activeInfo.embeddings}/{activeInfo.total} ({activeInfo.percentage}%)</span>
                </div>
                <Progress value={activeInfo.percentage} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Проданные:</span>
                  <span>{soldInfo.embeddings}/{soldInfo.total} ({soldInfo.percentage}%)</span>
                </div>
                <Progress value={soldInfo.percentage} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Общий прогресс:</span>
                  <span>{stats.embeddingsCount}/{stats.totalProducts} ({Math.round((stats.embeddingsCount / stats.totalProducts) * 100)}%)</span>
                </div>
                <Progress value={(stats.embeddingsCount / stats.totalProducts) * 100} className="h-3" />
              </div>
            </div>
          </div>
        )}

        {progress && (
          <div className="space-y-2 p-3 bg-blue-50 rounded-lg dark:bg-blue-950">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Обработано:</span>
                <span>{progress.processed}/{progress.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Обновлено:</span>
                <span>{progress.updated}</span>
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="text-xs text-center text-muted-foreground">
              {getProgressPercentage()}% завершено
            </div>
          </div>
        )}

        <Button 
          onClick={generateEmbeddings} 
          disabled={isGenerating || selectedStatuses.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Генерирую embeddings...
            </>
          ) : (
            `Обработать ${selectedStatuses.join(' и ')} товары (${selectedStatuses.reduce((total, status) => {
              if (status === 'active') return total + (stats?.activeProducts || 0);
              if (status === 'sold') return total + (stats?.soldProducts || 0);
              return total;
            }, 0)} шт.)`
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Процесс обработки займет 10-20 минут для всех товаров
        </p>
      </CardContent>
    </Card>
  );
};