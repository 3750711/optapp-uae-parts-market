
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader, AlertTriangle, ArrowLeft, Zap, RefreshCw } from 'lucide-react';

interface EnhancedInitializationStateProps {
  isInitializing: boolean;
  initializationError: string | null;
  initializationStage: string;
  initializationProgress: number;
  onForceComplete: () => void;
  onBack: () => void;
  onRetry: () => void;
}

export const EnhancedInitializationState: React.FC<EnhancedInitializationStateProps> = ({
  isInitializing,
  initializationError,
  initializationStage,
  initializationProgress,
  onForceComplete,
  onBack,
  onRetry
}) => {
  const getStageMessage = (stage: string) => {
    switch (stage) {
      case 'starting':
        return 'Запуск инициализации...';
      case 'route_check':
        return 'Проверка маршрута...';
      case 'auth_check':
        return 'Проверка аутентификации...';
      case 'admin_verification':
        return 'Проверка прав администратора...';
      case 'loading_data':
        return 'Загрузка данных...';
      case 'completed':
        return 'Инициализация завершена!';
      case 'timeout':
        return 'Превышен таймаут инициализации';
      case 'admin_check_failed':
        return 'Не удалось проверить права администратора';
      case 'access_denied':
        return 'Доступ запрещен';
      case 'data_load_failed':
        return 'Ошибка загрузки данных';
      case 'force_completed':
        return 'Принудительно завершено';
      case 'error':
        return 'Ошибка инициализации';
      default:
        return 'Инициализация...';
    }
  };

  const getStageIcon = (stage: string) => {
    if (['timeout', 'admin_check_failed', 'access_denied', 'data_load_failed', 'error'].includes(stage)) {
      return <AlertTriangle className="h-6 w-6 text-red-500" />;
    }
    if (stage === 'completed' || stage === 'force_completed') {
      return <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>;
    }
    return <Loader className="h-6 w-6 animate-spin text-blue-600" />;
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              {getStageIcon(initializationStage)}
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  {initializationError ? 'Ошибка инициализации' : 'Инициализация формы заказа'}
                </h3>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {getStageMessage(initializationStage)}
                  </p>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={initializationProgress} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">
                      {initializationProgress}% завершено
                    </p>
                  </div>
                </div>

                {/* Diagnostic information */}
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Этап: {initializationStage}</p>
                  <p>Время: {new Date().toLocaleTimeString()}</p>
                </div>

                {initializationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{initializationError}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-4">
                  {initializationError && (
                    <>
                      <Button 
                        onClick={onForceComplete}
                        variant="default"
                        size="sm"
                        className="w-full"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Принудительно завершить
                      </Button>
                      
                      <Button 
                        onClick={onRetry}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Повторить попытку
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    onClick={onBack}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Вернуться назад
                  </Button>
                </div>

                {/* Help text */}
                {initializationProgress > 80 && !initializationError && (
                  <p className="text-xs text-blue-600">
                    Почти готово, проверяем последние детали...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
