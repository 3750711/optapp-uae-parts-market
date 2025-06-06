
// Конфигурация для Telegram API и Edge Functions

// Telegram Bot Token
export const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

// Telegram Chat IDs
export const ORDER_GROUP_CHAT_ID = Deno.env.get("TELEGRAM_ORDER_GROUP_CHAT_ID");
export const PRODUCT_GROUP_CHAT_ID = Deno.env.get("TELEGRAM_PRODUCT_GROUP_CHAT_ID");

// Base URL for order links
export const ORDER_BASE_URL = "https://partsbay.ae/order/";

// CORS Headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Проверка настроек окружения
if (!BOT_TOKEN) {
  console.error("CRITICAL ERROR: TELEGRAM_BOT_TOKEN is not set in environment variables");
}

if (!ORDER_GROUP_CHAT_ID) {
  console.error("CRITICAL ERROR: TELEGRAM_ORDER_GROUP_CHAT_ID is not set in environment variables");
}

if (!PRODUCT_GROUP_CHAT_ID) {
  console.error("CRITICAL ERROR: TELEGRAM_PRODUCT_GROUP_CHAT_ID is not set in environment variables");
}

// Logging environment status
console.log("Environment:", {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  ORDER_GROUP_CHAT_ID_EXISTS: !!ORDER_GROUP_CHAT_ID,
  PRODUCT_GROUP_CHAT_ID_EXISTS: !!PRODUCT_GROUP_CHAT_ID,
});

// Notification configuration
export const MIN_IMAGES_REQUIRED = 1; // Minimum number of images required for notifications
export const MAX_IMAGES_PER_GROUP = 10; // Maximum number of images per media group (Telegram limit)
