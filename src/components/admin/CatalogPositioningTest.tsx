import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { testCatalogPositioning, validateCatalogSystem } from "@/utils/testCatalogPositioning";
import { useState } from "react";
import { Loader2, Play, CheckCircle } from "lucide-react";

export const CatalogPositioningTest = () => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isRunningValidation, setIsRunningValidation] = useState(false);

  const handleRunTest = async () => {
    setIsRunningTest(true);
    try {
      await testCatalogPositioning();
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleRunValidation = async () => {
    setIsRunningValidation(true);
    try {
      await validateCatalogSystem();
    } finally {
      setIsRunningValidation(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Тест системы позиционирования каталога
        </CardTitle>
        <CardDescription>
          Проверка работы системы catalog_position для сортировки товаров и репостов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <Button 
            onClick={handleRunValidation}
            disabled={isRunningValidation}
            variant="outline"
            className="w-full justify-start"
          >
            {isRunningValidation ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Быстрая валидация системы
          </Button>
          
          <Button 
            onClick={handleRunTest}
            disabled={isRunningTest}
            className="w-full justify-start"
          >
            {isRunningTest ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Полный тест (создание → репост → удаление)
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Быстрая валидация:</strong> Проверяет текущее состояние товаров и сортировку
          </p>
          <p>
            <strong>Полный тест:</strong> Создает тестовый товар, проверяет репост и удаляет его
          </p>
          <p className="text-xs">
            💡 Результаты тестов смотрите в консоли разработчика (F12)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};