import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FailedNotification {
  id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  details: {
    error: string;
    notification_type: string;
    timestamp: string;
    error_message?: string;
    qstash_response?: string;
  };
}

export function FailedNotificationsMonitor() {
  const queryClient = useQueryClient();

  const { data: failedNotifications, isLoading } = useQuery({
    queryKey: ['failed-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_logs')
        .select('*')
        .eq('action_type', 'notification_failed')
        .eq('entity_type', 'product')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as FailedNotification[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const retryNotification = useMutation({
    mutationFn: async (notification: FailedNotification) => {
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          productId: notification.entity_id,
          notificationType: notification.details.notification_type || 'status_change',
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notification resent successfully');
      queryClient.invalidateQueries({ queryKey: ['failed-notifications'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to resend: ${error.message}`);
    },
  });

  if (isLoading) {
    return <div>Loading failed notifications...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Failed Product Notifications</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['failed-notifications'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!failedNotifications || failedNotifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No failed notifications</p>
        ) : (
          <div className="space-y-3">
            {failedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      {notification.details.error}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(notification.created_at), 'MMM dd, HH:mm:ss')}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Product ID:</span>{' '}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {notification.entity_id}
                    </code>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span>{' '}
                    {notification.details.notification_type}
                  </div>
                  {notification.details.error_message && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {notification.details.error_message}
                    </div>
                  )}
                  {notification.details.qstash_response && (
                    <div className="text-xs text-muted-foreground mt-1">
                      QStash: {notification.details.qstash_response}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => retryNotification.mutate(notification)}
                  disabled={retryNotification.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
