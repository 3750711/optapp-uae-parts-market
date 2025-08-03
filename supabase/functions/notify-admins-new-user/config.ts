// Configuration for admin notification system

// CORS Headers for API responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Telegram API constants
export const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Admin emails list
export const ADMIN_EMAILS = ['efg22971@gmail.com', 'ts1@g.com', 'Mironenkonastya1997@mail.ru'];

console.log('Admin New User Notification Environment:', {
  BOT_TOKEN_EXISTS: !!BOT_TOKEN,
  SUPABASE_URL_EXISTS: !!SUPABASE_URL,
  SERVICE_ROLE_KEY_EXISTS: !!SUPABASE_SERVICE_ROLE_KEY
});