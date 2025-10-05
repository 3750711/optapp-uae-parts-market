import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Clock, Calendar, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { SessionTimeline } from "@/components/admin/SessionTimeline";
import { 
  getTerminationReasonColor, 
  getTerminationReasonLabel, 
  formatDuration 
} from "@/hooks/useUserSessions";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function SessionDetailsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useSessionDetails(sessionId);

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/activity-monitor')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку сессий
        </Button>
        
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/activity-monitor')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку сессий
        </Button>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-destructive" />
              <p className="text-lg font-medium">Ошибка загрузки сессии</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.message || 'Сессия не найдена'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { session, events } = data;
  const sessionDuration = session.ended_at 
    ? Math.floor((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/admin/activity-monitor')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку сессий
        </Button>
      </div>

      {/* Session Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Информация о сессии
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Пользователь</p>
              <p className="text-sm text-muted-foreground">
                {session.profiles?.full_name || 'Без имени'}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.profiles?.email}
              </p>
              <Badge variant="outline" className="mt-1">
                {session.profiles?.user_type || 'N/A'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Начало</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.started_at), 'dd MMM yyyy', { locale: ru })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(session.started_at), 'HH:mm:ss', { locale: ru })}
                </p>
              </div>
            </div>

            {/* End Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Конец</p>
                {session.ended_at ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.ended_at), 'dd MMM yyyy', { locale: ru })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(session.ended_at), 'HH:mm:ss', { locale: ru })}
                    </p>
                  </>
                ) : (
                  <Badge variant="default">Активна</Badge>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Длительность</p>
                <p className="text-sm text-muted-foreground">
                  {sessionDuration ? formatDuration(sessionDuration) : 'В процессе'}
                </p>
              </div>
            </div>
          </div>

          {/* Termination Reason */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Статус завершения</p>
            <Badge className={getTerminationReasonColor(session.termination_reason)}>
              {getTerminationReasonLabel(session.termination_reason)}
            </Badge>
            {session.termination_details && (
              <p className="text-sm text-muted-foreground mt-2">
                {session.termination_details}
              </p>
            )}
          </div>

          {/* Event Stats */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Статистика событий</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground">Всего событий</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.action_type === 'page_view').length}
                </p>
                <p className="text-xs text-muted-foreground">Просмотров страниц</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Хронология событий</h2>
        <SessionTimeline
          events={events}
          sessionStarted={session.started_at}
          sessionEnded={session.ended_at}
        />
      </div>
    </div>
  );
}
