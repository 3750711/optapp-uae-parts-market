/**
 * Activity Logger Stubs
 * Заглушки для безопасного отключения системы мониторинга
 * Все данные теперь собираются через Microsoft Clarity
 */

export const logActivity = async (): Promise<void> => {
  return Promise.resolve();
};

export const logUserLogin = async (): Promise<void> => {
  return Promise.resolve();
};

export const logUserLogout = async (): Promise<void> => {
  return Promise.resolve();
};

export const logPageView = async (): Promise<void> => {
  return Promise.resolve();
};

export const logClientError = async (): Promise<void> => {
  return Promise.resolve();
};

export const logApiError = async (): Promise<void> => {
  return Promise.resolve();
};

export const logButtonClick = async (): Promise<void> => {
  return Promise.resolve();
};

export interface ActivityEvent {
  event_type: string;
  event_subtype?: string;
  path?: string;
  metadata?: Record<string, any>;
  user_id?: string | null;
}
