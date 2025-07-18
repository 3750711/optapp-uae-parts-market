export type NotificationType = 
  | 'NEW_ORDER'
  | 'ORDER_STATUS_CHANGE' 
  | 'PRODUCT_STATUS_CHANGE'
  | 'NEW_PRODUCT'
  | 'ADMIN_MESSAGE'
  | 'PRICE_OFFER'
  | 'PRICE_OFFER_SUBMITTED'
  | 'PRICE_OFFER_RESPONSE'
  | 'PRICE_OFFER_ACCEPTED'
  | 'PROFILE_UPDATE'
  | 'SYSTEM_MESSAGE';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationData {
  order_id?: string;
  product_id?: string;
  offer_id?: string;
  status?: string;
  url?: string;
  [key: string]: any;
}