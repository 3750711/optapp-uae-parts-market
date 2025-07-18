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
  const { user_id, type, title, message, data } = payload;

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id,
      type,
      title,
      message,
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

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
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