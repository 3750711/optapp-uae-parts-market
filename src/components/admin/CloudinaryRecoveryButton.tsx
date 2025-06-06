
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { recoverCloudinaryData, validateProductIntegrity } from "@/utils/cloudinaryRecovery";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CloudinaryRecoveryButtonProps {
  productId?: string;
  onRecoveryComplete?: () => void;
}

export const CloudinaryRecoveryButton: React.FC<CloudinaryRecoveryButtonProps> = ({
  productId,
  onRecoveryComplete
}) => {
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } | null>(null);

  const handleRecovery = async () => {
    setIsRecovering(true);
    
    try {
      console.log('🚀 Starting Cloudinary recovery...', { productId });
      
      const result = await recoverCloudinaryData(productId);
      
      if (result.success) {
        toast({
          title: "Восстановление завершено",
          description: `Обновлено товаров: ${result.updatedProducts}`,
        });
        
        if (onRecoveryComplete) {
          onRecoveryComplete();
        }
        
        // Сразу проверяем валидность после восстановления
        if (productId) {
          handleValidation();
        }
      } else {
        toast({
          title: "Восстановление завершено с ошибками",
          description: `Обновлено: ${result.updatedProducts}, Ошибок: ${result.errors.length}`,
          variant: "destructive",
        });
        
        console.error('Recovery errors:', result.errors);
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      toast({
        title: "Ошибка восстановления",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleValidation = async () => {
    if (!productId) return;
    
    setIsValidating(true);
    
    try {
      const result = await validateProductIntegrity(productId);
      setValidationResult(result);
      
      if (result.isValid) {
        toast({
          title: "Проверка пройдена",
          description: "Товар имеет все необходимые данные",
        });
      } else {
        toast({
          title: "Найдены проблемы",
          description: `Обнаружено ${result.issues.length} проблем`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Ошибка валидации",
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleRecovery}
          disabled={isRecovering}
          variant="outline"
          size="sm"
        >
          {isRecovering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {productId ? 'Восстановить товар' : 'Восстановить все'}
        </Button>

        {productId && (
          <Button
            onClick={handleValidation}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Проверить
          </Button>
        )}
      </div>

      {validationResult && productId && (
        <Alert variant={validationResult.isValid ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Статус проверки:
                </span>
                <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                  {validationResult.isValid ? "✅ Все в порядке" : "❌ Есть проблемы"}
                </Badge>
              </div>

              {validationResult.issues.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Проблемы:</p>
                  <ul className="text-sm space-y-1">
                    {validationResult.issues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.suggestions.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-1">Рекомендации:</p>
                  <ul className="text-sm space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-500">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
