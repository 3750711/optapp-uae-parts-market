import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Database, Loader2 } from 'lucide-react';
import { useEmbeddingsGenerator } from '@/hooks/useEmbeddingsGenerator';

export const EmbeddingsGenerator: React.FC = () => {
  const { generateEmbeddings, fetchStats, isGenerating, progress, stats } = useEmbeddingsGenerator();

  useEffect(() => {
    fetchStats();
  }, []);

  const getProgressPercentage = () => {
    if (!stats || !progress) return 0;
    return stats.totalProducts > 0 ? Math.round((progress.processed / stats.totalProducts) * 100) : 0;
  };

  const getStatusBadge = () => {
    if (!stats) return null;
    
    const percentage = stats.totalProducts > 0 ? Math.round((stats.embeddingsCount / stats.totalProducts) * 100) : 0;
    
    if (percentage === 100) {
      return <Badge variant="default" className="bg-green-500">Завершено</Badge>;
    } else if (percentage > 0) {
      return <Badge variant="secondary">Частично</Badge>;
    } else {
      return <Badge variant="outline">Не настроено</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Embeddings
        </CardTitle>
        <CardDescription>
          Генерация векторных представлений для поиска
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                Embeddings:
              </span>
              <div className="flex items-center gap-2">
                <span>{stats.embeddingsCount} из {stats.totalProducts}</span>
                {getStatusBadge()}
              </div>
            </div>
            
            {stats.totalProducts > 0 && (
              <Progress 
                value={(stats.embeddingsCount / stats.totalProducts) * 100} 
                className="h-2"
              />
            )}
          </div>
        )}

        {progress && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Обработано: {progress.processed}, обновлено: {progress.updated}
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}

        <Button 
          onClick={generateEmbeddings} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Генерирую embeddings...
            </>
          ) : (
            'Сгенерировать embeddings'
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Процесс может занять 5-10 минут для обработки всех товаров
        </p>
      </CardContent>
    </Card>
  );
};