import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ProfileLoadingFallbackProps {
  onRetry: () => void;
  error?: string | null;
  isLoading?: boolean;
}

const ProfileLoadingFallback: React.FC<ProfileLoadingFallbackProps> = ({ 
  onRetry, 
  error, 
  isLoading = false 
}) => {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center px-6">
        <div className="space-y-6">
          {error ? (
            <>
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Ошибка загрузки профиля
                </h2>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Загрузка профиля...
                </h2>
                <p className="text-sm text-muted-foreground">
                  Пожалуйста, подождите
                </p>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={onRetry}
              disabled={isLoading}
              className="w-full"
              variant={error ? "default" : "outline"}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Повторить попытку
                </>
              )}
            </Button>
            
            {error && (
              <p className="text-xs text-muted-foreground">
                Если проблема не исчезает, попробуйте перезайти в аккаунт
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLoadingFallback;