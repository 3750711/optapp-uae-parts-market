import { useMemo } from 'react';
import { ActivityEvent } from './useActivityData';
import { startOfDay, startOfHour, subDays, subHours } from 'date-fns';

export interface ActivityMetrics {
  totalEvents: number;
  activeUsers: number;
  pageViews: number;
  errors: number;
  avgSessionDuration: number;
  onlineNow: number;
  trend: number;
}

export function useActivityMetrics(data: ActivityEvent[] = []): ActivityMetrics {
  return useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const lastHour = startOfHour(subHours(now, 1));
    const last24Hours = subDays(now, 1);
    const last48Hours = subDays(now, 2);

    // Всего событий (за последние 7 дней)
    const totalEvents = data.length;

    // Активные пользователи за 24 часа
    const activeUsers = new Set(
      data
        .filter(event => new Date(event.created_at) >= last24Hours && event.user_id)
        .map(event => event.user_id)
    ).size;

    // Просмотры страниц сегодня
    const pageViews = data.filter(
      event => event.action_type === 'page_view' && new Date(event.created_at) >= today
    ).length;

    // Ошибки за последний час
    const errors = data.filter(
      event => 
        (event.action_type === 'client_error' || event.action_type === 'api_error') &&
        new Date(event.created_at) >= lastHour
    ).length;

    // Онлайн сейчас (активность за последние 5 минут)
    const fiveMinutesAgo = subHours(now, 0);
    fiveMinutesAgo.setMinutes(now.getMinutes() - 5);
    const onlineNow = new Set(
      data
        .filter(event => new Date(event.created_at) >= fiveMinutesAgo && event.user_id)
        .map(event => event.user_id)
    ).size;

    // Средняя длительность сессии (примерный расчет на основе временных промежутков)
    const avgSessionDuration = 0; // Будет вычисляться из user_sessions если нужно

    // Тренд (сравнение последних 24 часов с предыдущими 24 часами)
    const eventsLast24h = data.filter(
      event => new Date(event.created_at) >= last24Hours
    ).length;
    const eventsPrevious24h = data.filter(
      event => {
        const eventDate = new Date(event.created_at);
        return eventDate >= last48Hours && eventDate < last24Hours;
      }
    ).length;

    const trend = eventsPrevious24h > 0 
      ? Math.round(((eventsLast24h - eventsPrevious24h) / eventsPrevious24h) * 100)
      : 0;

    return {
      totalEvents,
      activeUsers,
      pageViews,
      errors,
      avgSessionDuration,
      onlineNow,
      trend,
    };
  }, [data]);
}
