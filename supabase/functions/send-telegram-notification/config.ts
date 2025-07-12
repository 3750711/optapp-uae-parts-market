
// Telegram API constants and configuration

// CORS Headers for API responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Telegram API constants
export const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
// Order notifications go to the original group
export const ORDER_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID_ORDERS') || '-4749346030'; 
// Product notifications go to the new group
export const PRODUCT_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '-4623601047';

// Minimum number of images required to send a notification
export const MIN_IMAGES_REQUIRED = 1;

// Maximum number of images per media group
export const MAX_IMAGES_PER_GROUP = 10;

// Base URL for order links
export const ORDER_BASE_URL = 'https://lovable.dev/projects/c014f9d5-5d5d-4d39-8818-e0435c781fa6/order/';

console.log('Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  ORDER_GROUP_CHAT_ID_EXISTS: !!ORDER_GROUP_CHAT_ID,
  PRODUCT_GROUP_CHAT_ID_EXISTS: !!PRODUCT_GROUP_CHAT_ID
});
