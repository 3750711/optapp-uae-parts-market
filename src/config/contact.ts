// Contact configuration for the application
export const CONTACT_CONFIG = {
  // Telegram manager configuration
  TELEGRAM_MANAGER: {
    username: 'Nastya_PostingLots_OptCargo',
    fallbackUrl: 'https://t.me/partsbay_support',
  },
  
  // Working hours configuration (can be moved to database later)
  DEFAULT_WORKING_HOURS: {
    saturday: '8:00 - 13:00, 16:00 - 21:00',
    sunday: '8:00 - 13:00, 16:00 - 21:00',
    monday: '8:00 - 13:00, 16:00 - 21:00',
    tuesday: '8:00 - 13:00, 16:00 - 21:00',
    wednesday: '8:00 - 13:00, 16:00 - 21:00',
    thursday: '8:00 - 13:00, 16:00 - 21:00',
    friday: 'выходной',
  },
  
  // Contact validation settings
  VALIDATION: {
    requireTelegram: false,
    requirePhone: false,
    fallbackToManager: true,
  },
  
  // Analytics event names
  ANALYTICS_EVENTS: {
    MANAGER_CONTACT: 'contact_manager_clicked',
    DIRECT_CONTACT: 'direct_contact_clicked',
    DIALOG_OPENED: 'communication_dialog_opened',
    DIALOG_CANCELLED: 'communication_dialog_cancelled',
  },
} as const;