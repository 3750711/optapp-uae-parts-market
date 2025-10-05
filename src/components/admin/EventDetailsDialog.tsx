import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, MapPin, Monitor, User } from "lucide-react";

interface EventLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
}

interface EventDetailsDialogProps {
  event: EventLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailsDialog = ({ event, open, onOpenChange }: EventDetailsDialogProps) => {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Детали события
            <Badge variant="outline">{event.action_type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timestamp */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Время</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: ru })}
              </p>
            </div>
          </div>

          {/* Path */}
          {event.path && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Страница</p>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {event.path}
                </p>
              </div>
            </div>
          )}

          {/* IP Address */}
          {event.ip_address && (
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">IP адрес</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {event.ip_address}
                </p>
              </div>
            </div>
          )}

          {/* User Agent */}
          {event.user_agent && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">User Agent</p>
                <p className="text-sm text-muted-foreground break-all">
                  {event.user_agent}
                </p>
              </div>
            </div>
          )}

          {/* Entity Info */}
          {event.entity_type && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Информация о сущности</p>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Тип:</span>{' '}
                  <Badge variant="secondary">{event.entity_type}</Badge>
                </p>
                {event.entity_id && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">ID:</span>{' '}
                    <span className="font-mono text-xs">{event.entity_id}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {event.details && Object.keys(event.details).length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Дополнительные данные</p>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
