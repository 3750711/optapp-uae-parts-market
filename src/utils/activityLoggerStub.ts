/**
 * Activity Logger Stubs
 * Заглушки для безопасного отключения системы мониторинга
 * Все данные теперь собираются через Microsoft Clarity
 */

export const logActivity = async (event: ActivityEvent): Promise<void> => {
  return Promise.resolve();
};

export const logUserLogin = async (method?: string, userId?: string): Promise<void> => {
  return Promise.resolve();
};

export const logUserLogout = async (userId?: string): Promise<void> => {
  return Promise.resolve();
};

export const logPageView = async (path: string, metadata?: Record<string, any>): Promise<void> => {
  return Promise.resolve();
};

export const logClientError = async (error: Error | string, context?: Record<string, any>): Promise<void> => {
  return Promise.resolve();
};

export const logApiError = async (endpoint: string, error: any, context?: Record<string, any>): Promise<void> => {
  return Promise.resolve();
};

export const logButtonClick = async (buttonId: string, context?: Record<string, any>): Promise<void> => {
  return Promise.resolve();
};

export interface ActivityEvent {
  event_type: string;
  event_subtype?: string;
  path?: string;
  metadata?: Record<string, any>;
  user_id?: string | null;
}
