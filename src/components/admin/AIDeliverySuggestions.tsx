import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Bot, Clock, TrendingUp, CheckCircle, X, Info, DollarSign } from 'lucide-react';
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
  onManualPriceChange: (price: number) => void;
  onRejectSuggestions: () => void;
}

export const AIDeliverySuggestions: React.FC<AIDeliverySuggestionsProps> = ({
  suggestedPrices,
  deliveryConfidence = 0,
  reasoning,
  currentDeliveryPrice = 0,
  onAcceptPrice,
  onManualPriceChange,
  onRejectSuggestions
}) => {
  const [localValue, setLocalValue] = React.useState(currentDeliveryPrice.toString());
  
  // Sync local value with prop changes
  React.useEffect(() => {
    setLocalValue(currentDeliveryPrice.toString());
  }, [currentDeliveryPrice]);
  
  const hasAiSuggestions = suggestedPrices && suggestedPrices.length > 0;

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
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="break-words">Стоимость доставки</span>
          </CardTitle>
          {hasAiSuggestions && (
            <Badge variant={confidenceInfo.variant} className={`${confidenceInfo.color} text-xs`}>
              AI {confidenceInfo.level} ({confidencePercent}%)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Текущая цена доставки */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <div>
              <div className="text-sm font-medium">
                {currentDeliveryPrice > 0 ? `$${currentDeliveryPrice}` : "Не установлена"}
              </div>
              <div className="text-xs text-muted-foreground">
                {hasAiSuggestions ? `Найдено ${reasoning?.matches_found || 0} аналогов` : "Ручная установка"}
              </div>
            </div>
          </div>
          
          {/* Ручной ввод цены */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="1"
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                const num = Number(e.target.value);
                if (!isNaN(num) && num >= 0) {
                  onManualPriceChange(num);
                }
              }}
              onBlur={() => {
                if (localValue === '' || Number(localValue) < 0) {
                  onManualPriceChange(0);
                  setLocalValue('0');
                }
              }}
              className="w-20 h-8 text-sm"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">$</span>
          </div>
        </div>

        {/* AI рекомендации (если есть) */}
        {hasAiSuggestions && (
          <>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">{getRecommendationText()}</div>
                  <div className="text-xs text-muted-foreground">AI рекомендации</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {suggestedPrices!.map((price, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={isCurrentPriceSuggested && currentDeliveryPrice === price ? "default" : "outline"}
                    onClick={() => onAcceptPrice(price)}
                    disabled={currentDeliveryPrice === price}
                    className="text-xs w-full sm:w-auto"
                  >
                    {currentDeliveryPrice === price ? (
                      <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    ) : null}
                    ${price}
                  </Button>
                ))}
              </div>
            </div>

            {/* Статус соответствия */}
            {currentDeliveryPrice > 0 && (
              <Alert className={isCurrentPriceSuggested ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {isCurrentPriceSuggested
                    ? `✅ Цена соответствует AI-рекомендации`
                    : `⚠️ Цена отличается от AI-рекомендаций`
                  }
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Статус для ручной установки */}
        {!hasAiSuggestions && currentDeliveryPrice > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              💡 Цена установлена вручную. AI-анализ не проводился.
            </AlertDescription>
          </Alert>
        )}

        {/* Детальная информация AI анализа */}
        {hasAiSuggestions && reasoning && (
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(reasoning.price_distribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 6)
                      .map(([price, count]) => (
                        <div key={price} className="flex justify-between bg-muted/50 px-2 py-1 rounded">
                          <span className="break-words">${price}</span>
                          <span className="text-muted-foreground flex-shrink-0">{count}x</span>
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

        {/* Управление предложениями */}
        {hasAiSuggestions && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRejectSuggestions}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Скрыть AI-предложения
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};