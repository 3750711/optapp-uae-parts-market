import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TelegramWebhookManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleAction = async (action: 'set' | 'info' | 'delete') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
        body: { action }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Успешно",
          description: data.message || `Webhook ${action === 'set' ? 'установлен' : action === 'delete' ? 'удален' : 'получен'}`,
        });
        
        if (data.webhookInfo) {
          setWebhookInfo(data.webhookInfo);
        }
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Webhook Management</CardTitle>
        <CardDescription>
          Управление webhook для подтверждения публикаций товаров в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => handleAction('set')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Установить Webhook
          </Button>
          
          <Button
            onClick={() => handleAction('info')}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Info className="mr-2 h-4 w-4" />}
            Проверить Статус
          </Button>
          
          <Button
            onClick={() => handleAction('delete')}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Удалить Webhook
          </Button>
        </div>

        {webhookInfo && (
          <Alert>
            <AlertDescription className="space-y-2">
              <div className="flex items-center gap-2">
                {webhookInfo.url ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-semibold">
                  {webhookInfo.url ? 'Webhook активен' : 'Webhook не установлен'}
                </span>
              </div>
              
              {webhookInfo.url && (
                <>
                  <div className="text-sm">
                    <span className="font-medium">URL:</span> {webhookInfo.url}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Pending updates:</span> {webhookInfo.pending_update_count || 0}
                  </div>
                  {webhookInfo.last_error_date && (
                    <div className="text-sm text-red-500">
                      <span className="font-medium">Last error:</span> {webhookInfo.last_error_message}
                    </div>
                  )}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Инструкция:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Нажмите "Установить Webhook" для регистрации webhook в Telegram</li>
              <li>Используйте "Проверить Статус" для проверки текущего состояния</li>
              <li>Webhook автоматически обрабатывает сообщения из группы -1679816540</li>
              <li>При получении сообщения с LOT номером статус товара обновляется на "sent"</li>
            </ol>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
