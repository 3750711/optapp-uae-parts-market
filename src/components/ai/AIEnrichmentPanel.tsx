import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, ArrowRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAIEnrichment } from '@/hooks/useAIEnrichment';
import AIProcessingIndicator from './AIProcessingIndicator';

interface AIEnrichmentPanelProps {
  title: string;
  brand?: string;
  model?: string;
  productId?: string;
  onApplyChanges: (changes: {
    title?: string;
    brand?: string;
    model?: string;
  }) => void;
  disabled?: boolean;
  className?: string;
}

const AIEnrichmentPanel: React.FC<AIEnrichmentPanelProps> = ({
  title,
  brand,
  model,
  productId,
  onApplyChanges,
  disabled = false,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const { 
    enrichProduct, 
    isLoading, 
    result, 
    error,
    reset,
    hasResult,
    isHighConfidence,
    isMediumConfidence 
  } = useAIEnrichment();

  const handleEnrich = async () => {
    if (!title.trim()) return;
    
    await enrichProduct({
      product_id: productId,
      title: title.trim(),
      brand,
      model
    });
  };

  const handleApplyChanges = () => {
    if (!result) return;
    
    const changes: { title?: string; brand?: string; model?: string } = {};
    if (result.corrected_title_ru !== title) {
      changes.title = result.corrected_title_ru;
    }
    if (result.brand && result.brand !== brand) {
      changes.brand = result.brand;
    }
    if (result.model && result.model !== model) {
      changes.model = result.model;
    }
    
    onApplyChanges(changes);
    reset();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.6) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Обогащение
        </CardTitle>
        <CardDescription>
          Автоматическое улучшение названия товара, определение марки и модели
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!hasResult && !error && (
          <div className="text-center py-4">
            <Button 
              onClick={handleEnrich}
              disabled={disabled || isLoading || !title.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Запустить AI обработку
                </>
              )}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <AIProcessingIndicator status="processing" />
            <div className="text-sm text-muted-foreground">
              AI анализирует название товара и определяет марку с моделью...
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-3">
            <AIProcessingIndicator status="failed" />
            <div className="text-sm text-red-600">
              {error.message}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={reset}
              className="w-full"
            >
              Попробовать снова
            </Button>
          </div>
        )}

        {hasResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <AIProcessingIndicator 
                status="completed" 
                confidence={result.confidence} 
              />
              <div className="flex items-center gap-2">
                {getConfidenceIcon(result.confidence)}
                <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                  {Math.round(result.confidence * 100)}% уверенность
                </span>
              </div>
            </div>

            {/* Changes Preview */}
            <div className="space-y-3">
              {result.corrected_title_ru !== title && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Исправленное название:</div>
                  <div className="p-3 bg-blue-50 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Было:</div>
                    <div className="text-sm mb-2 line-through text-gray-500">{title}</div>
                    <div className="text-sm text-gray-600 mb-1">Стало:</div>
                    <div className="text-sm font-medium text-blue-900">{result.corrected_title_ru}</div>
                  </div>
                </div>
              )}

              {(result.brand !== brand || result.model !== model) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Определено:</div>
                  <div className="flex gap-2">
                    {result.brand && result.brand !== brand && (
                      <Badge variant="secondary">
                        Марка: {result.brand}
                      </Badge>
                    )}
                    {result.model && result.model !== model && (
                      <Badge variant="secondary">
                        Модель: {result.model}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Corrections Details */}
            {result.corrections && result.corrections.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs"
                >
                  {showDetails ? 'Скрыть' : 'Показать'} детали исправлений
                </Button>
                
                {showDetails && (
                  <div className="mt-2 space-y-2">
                    <Separator />
                    {result.corrections.map((correction, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="line-through">{correction.from}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{correction.to}</span>
                        <span className="text-gray-400">({correction.reason})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleApplyChanges}
                className="flex-1"
                variant={isHighConfidence ? "default" : "secondary"}
              >
                Применить изменения
              </Button>
              <Button 
                variant="outline" 
                onClick={reset}
                size="sm"
              >
                Отклонить
              </Button>
            </div>

            {/* Confidence Warning */}
            {!isHighConfidence && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                {isMediumConfidence 
                  ? "⚠️ Средняя уверенность. Рекомендуется проверить изменения перед применением."
                  : "🚨 Низкая уверенность. Требуется ручная проверка всех изменений."
                }
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIEnrichmentPanel;