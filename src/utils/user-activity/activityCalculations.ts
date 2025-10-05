import { ActivityEvent } from '@/hooks/user-activity/useActivityData';
import { startOfHour, format } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface HourlyData {
  time: string;
  events: number;
  pageViews: number;
  errors: number;
}

export interface DailyData {
  date: string;
  events: number;
  pageViews: number;
  users: number;
}

export interface TopPage {
  path: string;
  views: number;
}

export function groupByHour(data: ActivityEvent[]): HourlyData[] {
  const grouped = new Map<string, HourlyData>();
  
  data.forEach(event => {
    const hour = startOfHour(new Date(event.created_at));
    const key = format(hour, 'HH:00', { locale: ru });
    
    if (!grouped.has(key)) {
      grouped.set(key, { time: key, events: 0, pageViews: 0, errors: 0 });
    }
    
    const entry = grouped.get(key)!;
    entry.events++;
    if (event.action_type === 'page_view') entry.pageViews++;
    if (event.action_type === 'client_error' || event.action_type === 'api_error') entry.errors++;
  });
  
  return Array.from(grouped.values()).sort((a, b) => 
    parseInt(a.time) - parseInt(b.time)
  );
}

export function groupByDay(data: ActivityEvent[]): DailyData[] {
  const grouped = new Map<string, DailyData>();
  
  data.forEach(event => {
    const date = format(new Date(event.created_at), 'dd.MM', { locale: ru });
    
    if (!grouped.has(date)) {
      grouped.set(date, { date, events: 0, pageViews: 0, users: 0 });
    }
    
    const entry = grouped.get(date)!;
    entry.events++;
    if (event.action_type === 'page_view') entry.pageViews++;
  });
  
  // Подсчитываем уникальных пользователей за день
  const usersByDay = new Map<string, Set<string>>();
  data.forEach(event => {
    if (!event.user_id) return;
    const date = format(new Date(event.created_at), 'dd.MM', { locale: ru });
    if (!usersByDay.has(date)) {
      usersByDay.set(date, new Set());
    }
    usersByDay.get(date)!.add(event.user_id);
  });
  
  usersByDay.forEach((users, date) => {
    const entry = grouped.get(date);
    if (entry) {
      entry.users = users.size;
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => {
    const [dayA, monthA] = a.date.split('.').map(Number);
    const [dayB, monthB] = b.date.split('.').map(Number);
    return monthA === monthB ? dayA - dayB : monthA - monthB;
  });
}

export function getTopPages(data: ActivityEvent[], limit: number = 10): TopPage[] {
  const pageViews = data.filter(event => 
    event.action_type === 'page_view' && event.path
  );
  
  const pathCounts = new Map<string, number>();
  pageViews.forEach(event => {
    const count = pathCounts.get(event.path!) || 0;
    pathCounts.set(event.path!, count + 1);
  });
  
  return Array.from(pathCounts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function getErrors(data: ActivityEvent[]): ActivityEvent[] {
  return data.filter(event => 
    event.action_type === 'client_error' || event.action_type === 'api_error'
  );
}
