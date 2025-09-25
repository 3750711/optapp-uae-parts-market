import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'create':
        return await createNotification(supabase, payload);
      case 'bulk_create':
        return await createBulkNotifications(supabase, payload);
      case 'cleanup':
        return await cleanupOldNotifications(supabase);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createNotification(supabase: any, payload: any) {
  const { user_id, type, title, message, data, title_en, message_en } = payload;

  // Get user type to determine language
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user_id)
    .single();

  const userType = profile?.user_type || 'buyer';
  const language = userType === 'seller' ? 'en' : 'ru';

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id,
      type,
      title: title || '',
      message: message || '',
      title_en: title_en || '',
      message_en: message_en || '',
      language,
      data: data || {}
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, notification }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createBulkNotifications(supabase: any, payload: any) {
  const { notifications } = payload;

  // Process each notification to add language and translations
  const processedNotifications = await Promise.all(
    notifications.map(async (notification: any) => {
      // Get user type to determine language
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', notification.user_id)
        .single();

      const userType = profile?.user_type || 'buyer';
      const language = userType === 'seller' ? 'en' : 'ru';

      return {
        ...notification,
        language,
        title: notification.title || '',
        message: notification.message || '',
        title_en: notification.title_en || '',
        message_en: notification.message_en || '',
        data: notification.data || {}
      };
    })
  );

  const { data, error } = await supabase
    .from('notifications')
    .insert(processedNotifications)
    .select();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, count: data.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function cleanupOldNotifications(supabase: any) {
  // Delete notifications older than 30 days
  const { error } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: 'Old notifications cleaned up' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}