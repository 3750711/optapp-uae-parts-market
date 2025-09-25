import { useNotificationContext } from '@/contexts/NotificationContext';

export const useNotifications = () => {
  return useNotificationContext();
};