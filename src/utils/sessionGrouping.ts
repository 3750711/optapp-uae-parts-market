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

  // Группируем по user_id
  const userEventsMap = new Map<string, UserActivity[]>();
  
  events.forEach(event => {
    const userId = event.user_id || 'anonymous';
    if (!userEventsMap.has(userId)) {
      userEventsMap.set(userId, []);
    }
    userEventsMap.get(userId)!.push(event);
  });

  const sessions: SessionGroup[] = [];

  // Обрабатываем события каждого пользователя
  userEventsMap.forEach((userEvents, userId) => {
    // Сортируем события по времени
    const sortedEvents = [...userEvents].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Разбиваем на сессии по логинам/логаутам
    let currentSessionEvents: UserActivity[] = [];
    let sessionStartEvent: UserActivity | null = null;

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const isLoginEvent = event.action_type === 'login_success' || 
                          event.action_type === 'login' ||
                          event.action_type === 'auth';
      const isLogoutEvent = event.action_type === 'logout';

      // Начало новой сессии
      if (isLoginEvent && currentSessionEvents.length === 0) {
        sessionStartEvent = event;
        currentSessionEvents.push(event);
      }
      // Начало новой сессии при уже существующей - закрываем предыдущую
      else if (isLoginEvent && currentSessionEvents.length > 0) {
        // Сохраняем предыдущую сессию
        sessions.push(createSessionFromEvents(currentSessionEvents, sessionStartEvent));
        // Начинаем новую
        sessionStartEvent = event;
        currentSessionEvents = [event];
      }
      // Конец текущей сессии
      else if (isLogoutEvent && currentSessionEvents.length > 0) {
        currentSessionEvents.push(event);
        sessions.push(createSessionFromEvents(currentSessionEvents, sessionStartEvent));
        currentSessionEvents = [];
        sessionStartEvent = null;
      }
      // Обычное событие
      else {
        // Если нет активной сессии, начинаем новую с текущего события
        if (currentSessionEvents.length === 0) {
          sessionStartEvent = event;
        }
        currentSessionEvents.push(event);
      }
    }

    // Если остались события в буфере - это активная сессия
    if (currentSessionEvents.length > 0) {
      sessions.push(createSessionFromEvents(currentSessionEvents, sessionStartEvent));
    }
  });

  // Сортируем сессии по времени начала (новые сверху)
  return sessions.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

function createSessionFromEvents(
  sessionEvents: UserActivity[], 
  sessionStartEvent: UserActivity | null
): SessionGroup {
  const sortedEvents = [...sessionEvents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const loginEvent = sortedEvents.find(e => 
    e.action_type === 'login_success' || 
    e.action_type === 'login' ||
    e.action_type === 'auth'
  ) || null;

  const logoutEvent = sortedEvents.find(e => 
    e.action_type === 'logout'
  ) || null;

  const pageViews = sortedEvents.filter(e => 
    e.action_type === 'page_view'
  );

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  const startTime = firstEvent.created_at;
  const endTime = logoutEvent?.created_at || null;
  
  const duration = endTime 
    ? new Date(endTime).getTime() - new Date(startTime).getTime()
    : null;

  const isActive = !logoutEvent;

  return {
    sessionId: firstEvent.session_id,
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
  };
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
