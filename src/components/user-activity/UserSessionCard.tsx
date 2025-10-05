import React, { useState } from 'react';
import { SessionGroup, formatSessionDuration } from '@/utils/sessionGrouping';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from '@/components/ui/collapsible';
import { 
  LogIn, 
  LogOut, 
  Monitor, 
  ChevronDown, 
  ChevronUp,
  User 
} from 'lucide-react';
import { getActionTypeLabel } from '@/hooks/useEventLogs';

interface UserSessionCardProps {
  session: SessionGroup;
}

const UserSessionCard: React.FC<UserSessionCardProps> = ({ session }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`transition-all hover:shadow-md ${
        session.isActive 
          ? 'border-l-4 border-l-green-500' 
          : 'border-l-4 border-l-muted'
      }`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">
                      {session.userName || session.userEmail || 'Неизвестный пользователь'}
                    </h3>
                    {session.isActive && (
                      <Badge variant="success" className="text-xs">
                        Активна
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <LogIn className="w-3 h-3" />
                      {formatTime(session.startTime)}
                    </span>
                    
                    {session.endTime && (
                      <>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          <LogOut className="w-3 h-3" />
                          {formatTime(session.endTime)}
                        </span>
                      </>
                    )}
                    
                    <span className="text-xs">
                      ({formatDate(session.startTime)})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatSessionDuration(session.duration)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.pageViews.length} страниц
                  </div>
                </div>
                
                <div className="ml-2">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2 pl-13">
              {/* Событие входа */}
              {session.loginEvent && (
                <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <LogIn className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success" className="text-xs">
                        {getActionTypeLabel(session.loginEvent.action_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(session.loginEvent.created_at)}
                      </span>
                    </div>
                    {session.loginEvent.path && (
                      <p className="text-sm text-muted-foreground truncate">
                        {session.loginEvent.path}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Просмотры страниц */}
              {session.pageViews.length > 0 && (
                <div className="space-y-1.5 pl-2">
                  {session.pageViews.map((event, index) => (
                    <div 
                      key={event.id} 
                      className="flex items-start gap-3 p-2 hover:bg-accent/50 rounded-md transition-colors"
                    >
                      <Monitor className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {event.path || 'Неизвестная страница'}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(event.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Событие выхода */}
              {session.logoutEvent && (
                <div className="flex items-start gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                  <LogOut className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {getActionTypeLabel(session.logoutEvent.action_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(session.logoutEvent.created_at)}
                      </span>
                    </div>
                    {session.logoutEvent.path && (
                      <p className="text-sm text-muted-foreground truncate">
                        {session.logoutEvent.path}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Если нет событий выхода для активной сессии */}
              {session.isActive && !session.logoutEvent && (
                <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Сессия активна</span>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default UserSessionCard;
