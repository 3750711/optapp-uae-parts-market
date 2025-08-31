import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    // Check if user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, id, telegram_username, is_local } = await req.json();

    console.log(`Admin ${user.id} performing action: ${action} on telegram accounts`);

    let result;

    switch (action) {
      case 'create':
        if (!telegram_username) {
          return new Response(
            JSON.stringify({ error: 'telegram_username is required for create action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: createData, error: createError } = await supabase
          .from('telegram_accounts_config')
          .insert({
            telegram_username: telegram_username.toLowerCase(),
            is_local: is_local || false,
            created_by: user.id
          })
          .select()
          .single();

        if (createError) {
          console.error('Create error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create telegram account config' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = createData;
        console.log(`Created telegram account config: ${telegram_username}`);
        break;

      case 'update':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'id is required for update action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updateData, error: updateError } = await supabase
          .from('telegram_accounts_config')
          .update({ 
            is_local: is_local,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update telegram account config' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = updateData;
        console.log(`Updated telegram account config: ${id}`);
        break;

      case 'delete':
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'id is required for delete action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('telegram_accounts_config')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to delete telegram account config' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { success: true };
        console.log(`Deleted telegram account config: ${id}`);
        break;

      case 'list':
        const { data: listData, error: listError } = await supabase
          .from('telegram_accounts_config')
          .select('*')
          .order('telegram_username');

        if (listError) {
          console.error('List error:', listError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch telegram account configs' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = listData;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use create, update, delete, or list' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-telegram-accounts function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});