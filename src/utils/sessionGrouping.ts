import { UserActivity } from '@/hooks/useEventLogs';

export interface SessionGroup {
  sessionId: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  startTime: string;
  endTime: string | null;
  loginEvent: UserActivity | null;
  logoutEvent: UserActivity | null;
  pageViews: UserActivity[];
  allEvents: UserActivity[];
  duration: number | null; // в миллисекундах
  isActive: boolean;
}

export function groupEventsBySessions(events: UserActivity[]): SessionGroup[] {
  if (!events || events.length === 0) return [];

  // Группируем по session_id
  const sessionMap = new Map<string, UserActivity[]>();
  
  events.forEach(event => {
    const sessionKey = event.session_id || 'no-session';
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(event);
  });

  // Преобразуем в SessionGroup
  const sessions: SessionGroup[] = [];

  sessionMap.forEach((sessionEvents, sessionId) => {
    // Сортируем события по времени
    const sortedEvents = [...sessionEvents].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Находим вход и выход
    const loginEvent = sortedEvents.find(e => 
      e.action_type === 'login_success' || 
      e.action_type === 'login' ||
      e.action_type === 'auth'
    ) || null;

    const logoutEvent = sortedEvents.find(e => 
      e.action_type === 'logout'
    ) || null;

    // Фильтруем просмотры страниц
    const pageViews = sortedEvents.filter(e => 
      e.action_type === 'page_view'
    );

    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];

    const startTime = firstEvent.created_at;
    const endTime = logoutEvent?.created_at || (lastEvent !== firstEvent ? lastEvent.created_at : null);
    
    const duration = endTime 
      ? new Date(endTime).getTime() - new Date(startTime).getTime()
      : null;

    const isActive = !logoutEvent;

    sessions.push({
      sessionId: sessionId === 'no-session' ? null : sessionId,
      userId: firstEvent.user_id,
      userName: firstEvent.profiles?.full_name || null,
      userEmail: firstEvent.profiles?.email || null,
      startTime,
      endTime,
      loginEvent,
      logoutEvent,
      pageViews,
      allEvents: sortedEvents,
      duration,
      isActive
    });
  });

  // Сортируем сессии по времени начала (новые сверху)
  return sessions.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function formatSessionDuration(milliseconds: number | null): string {
  if (!milliseconds) return 'Активная сессия';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  } else if (minutes > 0) {
    return `${minutes}м`;
  } else {
    return `${seconds}с`;
  }
}
