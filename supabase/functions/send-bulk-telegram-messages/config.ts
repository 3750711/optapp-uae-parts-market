// CORS headers for web app integration
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables validation
console.log('Bulk Message Environment:', {
  BOT_TOKEN_EXISTS: !!Deno.env.get('TELEGRAM_BOT_TOKEN'),
  SUPABASE_URL_EXISTS: !!Deno.env.get('SUPABASE_URL'),
  SERVICE_ROLE_KEY_EXISTS: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
})

// Bot configuration
export const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Rate limiting configuration
export const RATE_LIMIT = {
  MESSAGES_PER_SECOND: 30, // Telegram bot API limit
  BATCH_SIZE: 10, // Number of messages to send in parallel
  DELAY_BETWEEN_BATCHES: 1000, // 1 second delay between batches
}