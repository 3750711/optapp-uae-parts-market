
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cloud, AlertTriangle, CheckCircle } from "lucide-react";
import { CloudinaryRecoveryButton } from "@/components/admin/CloudinaryRecoveryButton";
import { validateProductIntegrity } from "@/utils/cloudinaryRecovery";

interface ProductCloudinaryStatusProps {
  productId: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  previewImageUrl?: string;
  showRecoveryButton?: boolean;
}

export const ProductCloudinaryStatus: React.FC<ProductCloudinaryStatusProps> = ({
  productId,
  cloudinaryPublicId,
  cloudinaryUrl,
  previewImageUrl,
  showRecoveryButton = true
}) => {
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } | null>(null);

  const hasCloudinaryData = cloudinaryPublicId && cloudinaryUrl && previewImageUrl;

  useEffect(() => {
    const checkIntegrity = async () => {
      try {
        const result = await validateProductIntegrity(productId);
        setValidationResult(result);
      } catch (error) {
        console.error('Failed to validate product integrity:', error);
      }
    };

    checkIntegrity();
  }, [productId, cloudinaryPublicId, cloudinaryUrl, previewImageUrl]);

  const handleRecoveryComplete = () => {
    // Перезагружаем страницу или обновляем данные
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={hasCloudinaryData ? "default" : "destructive"} className="flex items-center gap-1">
          <Cloud className="h-3 w-3" />
          {hasCloudinaryData ? "Cloudinary интеграция активна" : "Cloudinary данные отсутствуют"}
        </Badge>
        
        {validationResult && (
          <Badge variant={validationResult.isValid ? "default" : "secondary"} className="flex items-center gap-1">
            {validationResult.isValid ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {validationResult.isValid ? "Проверка пройдена" : `${validationResult.issues.length} проблем`}
          </Badge>
        )}
      </div>

      {!hasCloudinaryData && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Проблема с Cloudinary интеграцией</p>
              <p className="text-sm">
                У этого товара отсутствуют данные Cloudinary, что может привести к проблемам с отображением 
                изображений в каталоге и медленной загрузке.
              </p>
              
              <div className="space-y-1 text-sm">
                <p className="font-medium">Отсутствующие данные:</p>
                <ul className="list-disc list-inside space-y-1">
                  {!cloudinaryPublicId && <li>Public ID</li>}
                  {!cloudinaryUrl && <li>Cloudinary URL</li>}
                  {!previewImageUrl && <li>Preview URL</li>}
                </ul>
              </div>

              {showRecoveryButton && (
                <div className="mt-3">
                  <CloudinaryRecoveryButton 
                    productId={productId}
                    onRecoveryComplete={handleRecoveryComplete}
                  />
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validationResult && !validationResult.isValid && hasCloudinaryData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Найдены другие проблемы с товаром:</p>
              <ul className="text-sm space-y-1">
                {validationResult.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
              
              {showRecoveryButton && (
                <div className="mt-3">
                  <CloudinaryRecoveryButton 
                    productId={productId}
                    onRecoveryComplete={handleRecoveryComplete}
                  />
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
