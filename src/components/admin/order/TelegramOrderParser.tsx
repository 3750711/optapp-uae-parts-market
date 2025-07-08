import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, ChevronDown, CheckCircle, AlertCircle, AlertTriangle, Copy } from 'lucide-react';
import { parseTelegramOrder, ParsedTelegramOrder, validateParsedOrder } from '@/utils/parseTelegramOrder';
import { toast } from '@/hooks/use-toast';

interface TelegramOrderParserProps {
  onDataParsed: (data: ParsedTelegramOrder) => void;
  disabled?: boolean;
}

export const TelegramOrderParser: React.FC<TelegramOrderParserProps> = ({
  onDataParsed,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [telegramText, setTelegramText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTelegramOrder | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleParseText = useCallback(() => {
    if (!telegramText.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения из Telegram",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = parseTelegramOrder(telegramText);
      
      if (result.success && result.data) {
        // Дополнительная валидация
        const validationErrors = validateParsedOrder(result.data);
        
        if (validationErrors.length > 0) {
          setParseErrors([...result.errors, ...validationErrors]);
          setParseWarnings(result.warnings);
          setParsedData(null);
        } else {
          setParsedData(result.data);
          setParseErrors(result.errors);
          setParseWarnings(result.warnings);
          
          toast({
            title: "Успешно распознано",
            description: `Данные заказа успешно извлечены из сообщения${result.warnings.length > 0 ? ' (есть предупреждения)' : ''}`,
          });
        }
      } else {
        setParseErrors(result.errors);
        setParseWarnings(result.warnings);
        setParsedData(null);
      }
    } catch (error) {
      setParseErrors([`Неожиданная ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`]);
      setParseWarnings([]);
      setParsedData(null);
    } finally {
      setIsProcessing(false);
    }
  }, [telegramText]);

  const handleApplyData = useCallback(() => {
    if (parsedData) {
      onDataParsed(parsedData);
      toast({
        title: "Данные применены",
        description: "Поля формы заполнены данными из Telegram",
      });
      setIsOpen(false);
    }
  }, [parsedData, onDataParsed]);

  const handleClear = useCallback(() => {
    setTelegramText('');
    setParsedData(null);
    setParseErrors([]);
    setParseWarnings([]);
  }, []);

  const exampleText = `Заказ: 07404
Статус: Зарегистрирован
Telegram отправителя: @optshop2_bot

🟰🟰🟰🟰🟰🟰

Наименование: Бампер передний Toyota Carina
Количество мест: 1

🟰🟰🟰🟰🟰🟰
Стоимость: 62$
Стоимость доставки: 27$

===
MDY
PETR`;

  const copyExample = () => {
    navigator.clipboard.writeText(exampleText);
    toast({
      title: "Скопировано",
      description: "Пример сообщения скопирован в буфер обмена",
    });
  };

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Вставить из Telegram</CardTitle>
                <Badge variant="outline" className="text-xs">
                  Быстрое заполнение
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Вставьте сообщение из Telegram для автоматического заполнения полей заказа
            </div>

            {/* Пример сообщения */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Формат сообщения:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyExample}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Копировать пример
                  </Button>
                </div>
                <pre className="text-xs mt-2 p-2 bg-muted/50 rounded overflow-x-auto whitespace-pre-wrap">
                  {exampleText}
                </pre>
              </AlertDescription>
            </Alert>

            {/* Поле ввода */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Текст сообщения из Telegram</label>
              <Textarea
                value={telegramText}
                onChange={(e) => setTelegramText(e.target.value)}
                placeholder="Вставьте сообщение из Telegram здесь..."
                rows={8}
                disabled={disabled || isProcessing}
                className="font-mono text-sm"
              />
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <Button
                onClick={handleParseText}
                disabled={disabled || isProcessing || !telegramText.trim()}
                className="flex-1"
              >
                {isProcessing ? 'Обработка...' : 'Распознать данные'}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={disabled || isProcessing}
              >
                Очистить
              </Button>
            </div>

            {/* Ошибки парсинга */}
            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Ошибки при распознавании:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {parseErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Предупреждения */}
            {parseWarnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Предупреждения:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {parseWarnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Успешно распознанные данные */}
            {parsedData && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-medium text-green-800 mb-3">Данные успешно распознаны:</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Наименование:</span>
                      <div className="text-green-700">{parsedData.title}</div>
                    </div>
                    <div>
                      <span className="font-medium">Количество мест:</span>
                      <div className="text-green-700">{parsedData.place_number}</div>
                    </div>
                    <div>
                      <span className="font-medium">Стоимость:</span>
                      <div className="text-green-700">${parsedData.price}</div>
                    </div>
                    {parsedData.delivery_price && (
                      <div>
                        <span className="font-medium">Доставка:</span>
                        <div className="text-green-700">${parsedData.delivery_price}</div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Покупатель:</span>
                      <div className="text-green-700">{parsedData.buyerOptId}</div>
                    </div>
                    <div>
                      <span className="font-medium">Продавец:</span>
                      <div className="text-green-700">{parsedData.sellerOptId}</div>
                    </div>
                    {parsedData.brand && (
                      <div>
                        <span className="font-medium">Бренд:</span>
                        <div className="text-green-700">{parsedData.brand}</div>
                      </div>
                    )}
                    {parsedData.model && (
                      <div>
                        <span className="font-medium">Модель:</span>
                        <div className="text-green-700">{parsedData.model}</div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleApplyData}
                    className="mt-3 w-full"
                    disabled={disabled}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Заполнить поля формы
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};