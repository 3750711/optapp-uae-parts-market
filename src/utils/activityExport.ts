import { format } from 'date-fns';

interface ExportablePageView {
  created_at: string;
  user_name: string;
  user_email: string;
  path: string;
  referrer: string;
  user_agent: string;
}

/**
 * Export page views to CSV format
 */
export const exportPageViewsToCSV = (data: ExportablePageView[]): void => {
  if (!data || data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // CSV headers
  const headers = ['Время', 'Пользователь', 'Email', 'Путь', 'Referrer', 'Браузер'];
  
  // CSV rows
  const rows = data.map(item => [
    format(new Date(item.created_at), 'dd.MM.yyyy HH:mm:ss'),
    item.user_name || 'Гость',
    item.user_email || '-',
    item.path || '-',
    item.referrer || '-',
    item.user_agent || '-',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `page-views-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export page views to JSON format
 */
export const exportPageViewsToJSON = (data: ExportablePageView[]): void => {
  if (!data || data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `page-views-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
