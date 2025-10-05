import { useCallback } from 'react';
import { ActivityEvent } from './useActivityData';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function useActivityExport() {
  const exportToCSV = useCallback((data: ActivityEvent[], filename = 'activity-export.csv') => {
    if (!data || data.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Формируем CSV заголовки
    const headers = [
      'Время',
      'Пользователь',
      'Email',
      'Тип события',
      'Подтип',
      'Путь',
      'IP адрес',
      'Браузер'
    ];

    // Формируем строки данных
    const rows = data.map(event => [
      format(new Date(event.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru }),
      event.profiles?.full_name || 'Аноним',
      event.profiles?.email || '-',
      event.action_type,
      event.event_subtype || '-',
      event.path || '-',
      event.ip_address || '-',
      event.user_agent || '-'
    ]);

    // Создаем CSV контент
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Создаем Blob и скачиваем
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const exportToJSON = useCallback((data: ActivityEvent[], filename = 'activity-export.json') => {
    if (!data || data.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Форматируем данные для JSON
    const jsonData = data.map(event => ({
      time: format(new Date(event.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru }),
      user: event.profiles?.full_name || 'Аноним',
      email: event.profiles?.email || null,
      event_type: event.action_type,
      event_subtype: event.event_subtype || null,
      path: event.path || null,
      ip_address: event.ip_address || null,
      user_agent: event.user_agent || null,
      details: event.details
    }));

    // Создаем JSON контент
    const jsonContent = JSON.stringify(jsonData, null, 2);

    // Создаем Blob и скачиваем
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  return {
    exportToCSV,
    exportToJSON,
  };
}
