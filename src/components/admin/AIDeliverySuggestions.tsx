import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Bot, Clock, TrendingUp, CheckCircle, X, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AIDeliverySuggestionsProps {
  suggestedPrices?: number[];
  deliveryConfidence?: number;
  reasoning?: {
    matches_found: number;
    search_queries: string[];
    price_distribution: Record<string, number>;
    top_confidence: number;
    logic_type: string;
    similar_products: Array<{id: string, title: string, price: number}>;
    execution_time_ms: number;
    analysis_summary: string;
  };
  currentDeliveryPrice?: number;
  onAcceptPrice: (price: number) => void;
  onRejectSuggestions: () => void;
}

export const AIDeliverySuggestions: React.FC<AIDeliverySuggestionsProps> = ({
  suggestedPrices,
  deliveryConfidence = 0,
  reasoning,
  currentDeliveryPrice = 0,
  onAcceptPrice,
  onRejectSuggestions
}) => {
  // Если нет предложений, не показываем компонент
  if (!suggestedPrices || suggestedPrices.length === 0) {
    return null;
  }

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { level: 'Высокая', color: 'bg-green-100 text-green-800', variant: 'default' as const };
    if (confidence >= 0.6) return { level: 'Средняя', color: 'bg-yellow-100 text-yellow-800', variant: 'secondary' as const };
    return { level: 'Низкая', color: 'bg-red-100 text-red-800', variant: 'destructive' as const };
  };

  const confidenceInfo = getConfidenceLevel(deliveryConfidence);
  const confidencePercent = Math.round(deliveryConfidence * 100);

  const getRecommendationText = () => {
    if (suggestedPrices.length === 1) {
      return `Рекомендуется: $${suggestedPrices[0]}`;
    }
    return `Диапазон: $${Math.min(...suggestedPrices)} - $${Math.max(...suggestedPrices)}`;
  };

  const getLogicTypeDescription = (logicType: string) => {
    switch (logicType) {
      case 'engine_code_exact': return 'Точное совпадение кода двигателя';
      case 'part_model_exact': return 'Точное совпадение детали + модель';
      case 'fuzzy_similarity': return 'Похожие товары';
      case 'category_fallback': return 'По категории товаров';
      default: return 'Смешанный анализ';
    }
  };

  const isPriceAlreadySet = currentDeliveryPrice > 0;
  const isCurrentPriceSuggested = isPriceAlreadySet && suggestedPrices.includes(currentDeliveryPrice);

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-600" />
            AI-анализ доставки
          </CardTitle>
          <Badge variant={confidenceInfo.variant} className={confidenceInfo.color}>
            {confidenceInfo.level} ({confidencePercent}%)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Основные рекомендации */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium text-sm">{getRecommendationText()}</div>
              <div className="text-xs text-muted-foreground">
                Найдено {reasoning?.matches_found || 0} аналогов
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {suggestedPrices.map((price, index) => (
              <Button
                key={index}
                size="sm"
                variant={isCurrentPriceSuggested && currentDeliveryPrice === price ? "default" : "outline"}
                onClick={() => onAcceptPrice(price)}
                disabled={currentDeliveryPrice === price}
                className="text-xs"
              >
                {currentDeliveryPrice === price ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : null}
                ${price}
              </Button>
            ))}
          </div>
        </div>

        {/* Статус */}
        {isPriceAlreadySet && (
          <Alert className={isCurrentPriceSuggested ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {isCurrentPriceSuggested
                ? `✅ Текущая цена $${currentDeliveryPrice} соответствует AI-рекомендации`
                : `⚠️ Текущая цена $${currentDeliveryPrice} отличается от рекомендаций AI`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Детальная информация */}
        {reasoning && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span>Детали анализа</span>
                <Info className="h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3 pt-3">
              {/* Логика анализа */}
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Метод:</span>
                  <span>{getLogicTypeDescription(reasoning.logic_type)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Время анализа:</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {reasoning.execution_time_ms}ms
                  </span>
                </div>

                {reasoning.search_queries.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Поиск по:</span>
                    <span>{reasoning.search_queries.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Распределение цен */}
              {Object.keys(reasoning.price_distribution).length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Распределение цен:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {Object.entries(reasoning.price_distribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 6)
                      .map(([price, count]) => (
                        <div key={price} className="flex justify-between bg-muted/50 px-2 py-1 rounded">
                          <span>${price}</span>
                          <span className="text-muted-foreground">{count}x</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Похожие товары */}
              {reasoning.similar_products.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Похожие товары:</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {reasoning.similar_products.slice(0, 3).map((product, index) => (
                      <div key={index} className="text-xs bg-muted/30 px-2 py-1 rounded">
                        <div className="flex justify-between">
                          <span className="truncate">{product.title}</span>
                          <span className="font-medium">${product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Резюме анализа */}
              <div className="bg-muted/30 p-2 rounded text-xs">
                <div className="font-medium mb-1">Резюме:</div>
                <div className="text-muted-foreground">{reasoning.analysis_summary}</div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Кнопка отклонения */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRejectSuggestions}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Скрыть предложения
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};