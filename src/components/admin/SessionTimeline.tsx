import { useState } from "react";
import { Clock, MousePointerClick, Eye, FileText, LogOut, LogIn } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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

interface SessionTimelineProps {
  events: EventLog[];
  sessionStarted: string;
  sessionEnded: string | null;
}

const getEventIcon = (actionType: string) => {
  switch (actionType) {
    case 'login': return <LogIn className="h-4 w-4 text-success" />;
    case 'logout': return <LogOut className="h-4 w-4 text-destructive" />;
    case 'page_view': return <Eye className="h-4 w-4 text-primary" />;
    case 'button_click': return <MousePointerClick className="h-4 w-4 text-secondary" />;
    default: return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
};

const getEventTypeLabel = (actionType: string) => {
  const labels: Record<string, string> = {
    'login': 'Вход',
    'logout': 'Выход',
    'page_view': 'Просмотр страницы',
    'button_click': 'Клик',
    'api_call': 'API запрос',
    'search': 'Поиск',
    'filter': 'Фильтр'
  };
  return labels[actionType] || actionType;
};

export const SessionTimeline = ({ events, sessionStarted, sessionEnded }: SessionTimelineProps) => {
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Нет событий в этой сессии</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Session start marker */}
          <div className="flex items-start gap-3 pb-3 border-b">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <LogIn className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-success">Начало сессии</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(sessionStarted), 'dd MMM yyyy, HH:mm:ss', { locale: ru })}
              </p>
            </div>
          </div>

          {/* Events */}
          {events.map((event, index) => (
            <div 
              key={event.id} 
              className="flex items-start gap-3 pb-3 border-b last:border-0 hover:bg-muted/50 -mx-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {getEventIcon(event.action_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{getEventTypeLabel(event.action_type)}</p>
                  {event.entity_type && (
                    <Badge variant="outline" className="text-xs">
                      {event.entity_type}
                    </Badge>
                  )}
                </div>
                {event.path && (
                  <p className="text-sm text-muted-foreground truncate">
                    {event.path}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), 'HH:mm:ss', { locale: ru })}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                Детали
              </Button>
            </div>
          ))}

          {/* Session end marker */}
          {sessionEnded && (
            <div className="flex items-start gap-3 pt-3 border-t">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive">Конец сессии</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(sessionEnded), 'dd MMM yyyy, HH:mm:ss', { locale: ru })}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <EventDetailsDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </>
  );
};
