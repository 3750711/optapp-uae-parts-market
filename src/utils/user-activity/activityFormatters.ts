import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm:ss', { locale: ru });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
}

export function getUserAgentShort(userAgent: string | null): string {
  if (!userAgent) return '-';
  
  // Извлекаем браузер
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return userAgent.substring(0, 20) + '...';
}

export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'page_view': 'Просмотр страницы',
    'login': 'Вход',
    'logout': 'Выход',
    'button_click': 'Клик',
    'client_error': 'Ошибка клиента',
    'api_error': 'Ошибка API',
    'create': 'Создание',
    'update': 'Обновление',
    'delete': 'Удаление',
  };
  
  return labels[eventType] || eventType;
}

export function getEventTypeColor(eventType: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (eventType === 'login' || eventType === 'page_view') return 'default';
  if (eventType === 'logout' || eventType.includes('error')) return 'destructive';
  if (eventType === 'button_click') return 'secondary';
  return 'outline';
}
