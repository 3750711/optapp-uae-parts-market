// Configuration for personal Telegram messaging

// CORS Headers for API responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Telegram API constants
export const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// Maximum number of images per media group
export const MAX_IMAGES_PER_GROUP = 10;

console.log('Personal Message Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  SUPABASE_URL_EXISTS: !!Deno.env.get('SUPABASE_URL'),
  SERVICE_ROLE_KEY_EXISTS: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
});